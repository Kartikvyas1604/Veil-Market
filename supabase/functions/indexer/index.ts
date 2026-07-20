/**
 * VEIL Chain Indexer — Supabase Edge Function
 *
 * Listens to VeilFactory and VeilMarket events and projects them into
 * the Supabase read-cache tables. This function should be called on a
 * schedule (every ~30s) or triggered by webhooks for lower latency.
 *
 * Architecture:
 *   1. Raw chain events → raw_events staging table (audit trail)
 *   2. Projection logic → clean tables (markets, odds_snapshots, position_commitments)
 *
 * This two-step pattern lets you replay from any block if the projection
 * logic has a bug — the raw event log is always intact.
 *
 * SECURITY INVARIANT:
 * This indexer NEVER stores plaintext bet amounts. The BetPlaced event
 * contains only a nullifier and a side (YES/NO). The encrypted ciphertext
 * is logged in raw_events for completeness but is never decoded to a
 * plaintext amount here — it cannot be, because the indexer doesn't hold
 * the decryption key.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Real keccak256 — not SHA-256. This is critical for matching EVM event topics.
import { keccak_256 } from "https://esm.sh/@noble/hashes@1.3.3/sha3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const AVALANCHE_RPC =
  Deno.env.get("AVALANCHE_RPC") ||
  "https://api.avax-test.network/ext/bc/C/rpc";
const VEIL_FACTORY_ADDRESS = (
  Deno.env.get("VEIL_FACTORY_ADDRESS") || ""
).toLowerCase();

// ─── Event Topic Computation (real keccak256) ─────────────────────────────

function keccak256Hex(data: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  const hash = keccak_256(bytes);
  return (
    "0x" +
    Array.from(hash)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Pre-compute event topics from canonical event signatures
const TOPICS = {
  // VeilFactory events
  MARKET_CREATED: keccak256Hex("MarketCreated(uint256,address,string,uint256)"),
  // Extended event with category
  MARKET_CREATED_EXTENDED: keccak256Hex(
    "MarketCreatedExtended(uint256,address,string,string,uint256)"
  ),

  // VeilMarket events
  BET_PLACED: keccak256Hex(
    "BetPlaced(uint256,address,uint8,bytes32,(uint256,uint256),(uint256,uint256))"
  ),
  POOL_DECRYPTED: keccak256Hex(
    "PoolDecrypted(uint256,uint256,uint256,uint256,uint256)"
  ),
  MARKET_RESOLVED: keccak256Hex(
    "MarketResolved(uint256,uint8,uint256)"
  ),
  DECRYPTION_SHARE_SUBMITTED: keccak256Hex(
    "DecryptionShareSubmitted(uint256,address,uint256)"
  ),
} as const;

// ─── RPC Helpers ───────────────────────────────────────────────────────────

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(AVALANCHE_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = (await res.json()) as { result?: unknown; error?: unknown };
  if (data.error) throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
  return data.result;
}

async function getBlockNumber(): Promise<number> {
  const result = await rpc("eth_blockNumber", []);
  return parseInt(result as string, 16);
}

async function getLogs(
  addresses: string[],
  fromBlock: number,
  toBlock: number
): Promise<Log[]> {
  const result = await rpc("eth_getLogs", [
    {
      fromBlock: "0x" + fromBlock.toString(16),
      toBlock: "0x" + toBlock.toString(16),
      address: addresses,
    },
  ]);
  return (result as Log[]) || [];
}

interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: string;
}

// ─── ABI Decoding Helpers ──────────────────────────────────────────────────

/** Decode a uint256 from a 32-byte hex word (without 0x prefix) */
function decodeUint256(word: string): bigint {
  return BigInt("0x" + word.padStart(64, "0"));
}

/** Decode an address from a 32-byte hex word (takes the last 20 bytes) */
function decodeAddress(word: string): string {
  return "0x" + word.slice(-40);
}

/** Decode a dynamic string from ABI-encoded data.
 *  The word at `offset` is a pointer (byte offset from data start).
 *  At pointer: 32 bytes length, then the UTF-8 bytes.
 */
function decodeString(data: string, offsetInWords: number): string {
  // data is hex without 0x, in 32-byte words
  // offsetInWords: which word in data contains the string pointer
  const ptrWord = data.slice(offsetInWords * 64, (offsetInWords + 1) * 64);
  const byteOffset = Number(decodeUint256(ptrWord));
  const wordOffset = byteOffset / 32;

  const lengthWord = data.slice(wordOffset * 64, (wordOffset + 1) * 64);
  const length = Number(decodeUint256(lengthWord));

  if (length === 0) return "";

  const strHex = data.slice((wordOffset + 1) * 64, (wordOffset + 1) * 64 + length * 2);
  let str = "";
  for (let i = 0; i < strHex.length; i += 2) {
    const code = parseInt(strHex.slice(i, i + 2), 16);
    if (code === 0) break;
    str += String.fromCharCode(code);
  }
  return str;
}

// ─── Market Address Tracking ───────────────────────────────────────────────

/** Fetch all known market contract addresses from Supabase */
async function getTrackedMarketAddresses(
  supabase: ReturnType<typeof createClient>
): Promise<string[]> {
  const { data } = await supabase
    .from("markets")
    .select("contract_address")
    .not("contract_address", "like", "0x00000000000000000%"); // exclude seed placeholders

  if (!data) return [];
  return data.map((r: { contract_address: string }) =>
    r.contract_address.toLowerCase()
  );
}

// ─── Event Projections ────────────────────────────────────────────────────

async function projectMarketCreated(
  supabase: ReturnType<typeof createClient>,
  log: Log
) {
  // MarketCreated(uint256 indexed marketId, address indexed marketContract, string question, uint256 resolutionTime)
  const marketId = Number(decodeUint256(log.topics[1].slice(2)));
  const contractAddress = decodeAddress(log.topics[2].slice(2));

  // data: ABI-encoded (string, uint256) — question + resolutionTime
  const data = log.data.slice(2); // remove 0x
  const question = decodeString(data, 0); // word 0 is pointer to question
  const resolutionTimeWord = data.slice(32 * 2, 64 * 2); // word 1
  const resolutionTime = new Date(
    Number(decodeUint256(resolutionTimeWord)) * 1000
  ).toISOString();

  const { error } = await supabase.from("markets").upsert(
    {
      market_id: marketId,
      contract_address: contractAddress,
      question: question || `Market #${marketId}`,
      category: "General",
      resolution_time: resolutionTime,
      status: "active",
      outcome: "none",
    },
    { onConflict: "market_id" }
  );

  if (error) console.error("Error projecting MarketCreated:", error);

  await supabase.from("market_activity").insert({
    market_id: marketId,
    event_type: "market_created",
    description: `New market: ${question || `Market #${marketId}`}`,
  });
}

async function projectMarketCreatedExtended(
  supabase: ReturnType<typeof createClient>,
  log: Log
) {
  // MarketCreatedExtended(uint256 indexed, address indexed, string question, string category, uint256 resolutionTime)
  const marketId = Number(decodeUint256(log.topics[1].slice(2)));

  const data = log.data.slice(2);
  const question = decodeString(data, 0);  // word 0: pointer to question
  const category = decodeString(data, 1);  // word 1: pointer to category
  // word 2 is resolutionTime — last dynamic field becomes inline after string pointers
  // ABI: pointer_q(32) pointer_cat(32) resolutionTime(32) str_q_len(32) str_q_data... str_cat_len(32) str_cat_data...
  const resolutionTimeWord = data.slice(2 * 64, 3 * 64);
  const resolutionTime = new Date(
    Number(decodeUint256(resolutionTimeWord)) * 1000
  ).toISOString();

  const { error } = await supabase.from("markets").upsert(
    {
      market_id: marketId,
      question: question || `Market #${marketId}`,
      category: category || "General",
      resolution_time: resolutionTime,
    },
    { onConflict: "market_id" }
  );

  if (error) console.error("Error projecting MarketCreatedExtended:", error);
}

async function projectBetPlaced(
  supabase: ReturnType<typeof createClient>,
  log: Log
) {
  // BetPlaced(uint256 indexed marketId, address indexed bettor, uint8 side, bytes32 nullifier, EGCT)
  const marketId = Number(decodeUint256(log.topics[1].slice(2)));
  const bettor = decodeAddress(log.topics[2].slice(2));

  const data = log.data.slice(2);
  const side = Number(decodeUint256(data.slice(0, 64)));
  const nullifier = "0x" + data.slice(64, 128);

  // The encrypted ciphertext (EGCT) is stored in raw_events but NOT decoded
  // to a plaintext amount — the indexer cannot do this and must not try.
  // SECURITY INVARIANT: no plaintext bet amounts stored off-chain.

  // Find the user in the users table by wallet address
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", bettor.toLowerCase())
    .single();

  if (!user) {
    // Auto-create user if they haven't signed in yet (bet was placed directly)
    const { data: newUser, error: createErr } = await supabase
      .from("users")
      .insert({ wallet_address: bettor.toLowerCase() })
      .select("id")
      .single();

    if (createErr || !newUser) {
      console.error("Could not create user for bettor:", bettor);
      return;
    }

    await supabase.from("position_commitments").upsert(
      {
        user_id: newUser.id,
        market_id: marketId,
        commitment_hash: nullifier,
        nullifier: nullifier,
        side: side,
        block_number: parseInt(log.blockNumber, 16),
        transaction_hash: log.transactionHash,
      },
      { onConflict: "nullifier" }
    );
  } else {
    await supabase.from("position_commitments").upsert(
      {
        user_id: user.id,
        market_id: marketId,
        commitment_hash: nullifier,
        nullifier: nullifier,
        side: side,
        block_number: parseInt(log.blockNumber, 16),
        transaction_hash: log.transactionHash,
      },
      { onConflict: "nullifier" }
    );
  }

  await supabase.from("market_activity").insert({
    market_id: marketId,
    event_type: "bet_placed",
    description: "New encrypted bet placed",
    metadata: { side: side === 1 ? "YES" : "NO" },
  });
}

async function projectPoolDecrypted(
  supabase: ReturnType<typeof createClient>,
  log: Log
) {
  // PoolDecrypted(uint256 indexed marketId, uint256 round, uint256 yesTotal, uint256 noTotal, uint256 totalBets)
  const marketId = Number(decodeUint256(log.topics[1].slice(2)));

  const data = log.data.slice(2);
  const round = Number(decodeUint256(data.slice(0, 64)));
  const yesTotal = decodeUint256(data.slice(64, 128)).toString();
  const noTotal = decodeUint256(data.slice(128, 192)).toString();
  const totalBets = Number(decodeUint256(data.slice(192, 256)));

  const { error } = await supabase.from("odds_snapshots").upsert(
    {
      market_id: marketId,
      round,
      yes_total: yesTotal,
      no_total: noTotal,
      total_bets: totalBets,
    },
    { onConflict: "market_id,round" }
  );

  if (error) console.error("Error projecting PoolDecrypted:", error);

  // Compute odds for activity description (safe — these are aggregate totals)
  const yes = BigInt(yesTotal);
  const no = BigInt(noTotal);
  const total = yes + no;
  const yesPct = total > 0n ? Number((yes * 1000n) / total) / 10 : 50;

  await supabase.from("market_activity").insert({
    market_id: marketId,
    event_type: "odds_updated",
    description: `Odds updated: YES ${yesPct.toFixed(1)}%`,
    metadata: { round, yes_total: yesTotal, no_total: noTotal },
  });
}

async function projectMarketResolved(
  supabase: ReturnType<typeof createClient>,
  log: Log
) {
  // MarketResolved(uint256 indexed marketId, uint8 outcome, uint256 timestamp)
  const marketId = Number(decodeUint256(log.topics[1].slice(2)));

  const data = log.data.slice(2);
  const outcomeValue = Number(decodeUint256(data.slice(0, 64)));
  const outcomeStr = outcomeValue === 1 ? "yes" : "no";

  await supabase
    .from("markets")
    .update({
      status: "resolved",
      outcome: outcomeStr,
      updated_at: new Date().toISOString(),
    })
    .eq("market_id", marketId);

  await supabase.from("market_activity").insert({
    market_id: marketId,
    event_type: "resolved",
    description: `Market resolved: ${outcomeStr.toUpperCase()}`,
    metadata: { outcome: outcomeStr },
  });
}

// ─── Main Handler ─────────────────────────────────────────────────────────

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get last processed block
    const { data: lastEvent } = await supabase
      .from("raw_events")
      .select("block_number")
      .order("block_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const fromBlock = lastEvent ? Number(lastEvent.block_number) + 1 : 0;
    const currentBlock = await getBlockNumber();

    if (fromBlock > currentBlock) {
      return new Response(
        JSON.stringify({ message: "No new blocks", currentBlock }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Get all market addresses we're tracking
    const marketAddresses = await getTrackedMarketAddresses(supabase);
    const allAddresses = VEIL_FACTORY_ADDRESS
      ? [VEIL_FACTORY_ADDRESS, ...marketAddresses]
      : marketAddresses;

    if (allAddresses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No contracts to watch. Set VEIL_FACTORY_ADDRESS." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;
    const batchSize = 2000;

    for (let start = fromBlock; start <= currentBlock; start += batchSize) {
      const end = Math.min(start + batchSize - 1, currentBlock);
      const logs = await getLogs(allAddresses, start, end);

      for (const log of logs) {
        const eventTopic = log.topics[0]?.toLowerCase();

        // 1. Store raw event (audit trail — always write first)
        await supabase.from("raw_events").upsert(
          {
            event_name: eventTopic,
            block_number: parseInt(log.blockNumber, 16),
            transaction_hash: log.transactionHash,
            log_index: parseInt(log.logIndex, 16),
            contract_address: log.address.toLowerCase(),
            args: { topics: log.topics, data: log.data },
            processed: false,
          },
          { onConflict: "transaction_hash,log_index" }
        );

        // 2. Project into clean tables
        try {
          if (eventTopic === TOPICS.MARKET_CREATED) {
            await projectMarketCreated(supabase, log);
          } else if (eventTopic === TOPICS.MARKET_CREATED_EXTENDED) {
            await projectMarketCreatedExtended(supabase, log);
          } else if (eventTopic === TOPICS.BET_PLACED) {
            await projectBetPlaced(supabase, log);
          } else if (eventTopic === TOPICS.POOL_DECRYPTED) {
            await projectPoolDecrypted(supabase, log);
          } else if (eventTopic === TOPICS.MARKET_RESOLVED) {
            await projectMarketResolved(supabase, log);
          }

          // Mark as processed
          await supabase
            .from("raw_events")
            .update({ processed: true })
            .eq("transaction_hash", log.transactionHash)
            .eq("log_index", parseInt(log.logIndex, 16));

          processedCount++;
        } catch (projErr) {
          console.error("Projection error for log", log.transactionHash, projErr);
          // Don't re-throw — we want to continue processing other logs
          // The raw event is stored so we can replay this log later
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: "Indexing complete",
        fromBlock,
        toBlock: currentBlock,
        processed: processedCount,
        watchingAddresses: allAddresses.length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Indexer fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
