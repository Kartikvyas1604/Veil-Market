"use server";

import { encodeFunctionData } from "viem";
import { supabase } from "@/lib/supabase";

/**
 * SECURITY INVARIANT:
 * This server action validates bet proofs BEFORE on-chain submission.
 * It NEVER sees plaintext bet amounts. The encryption and proof generation
 * happen entirely client-side in the user's browser.
 *
 * The only data that transits through this server action:
 * - Groth16 proof points (cryptographic, not plaintext)
 * - Public signals (commitments, not amounts)
 * - Encrypted ciphertexts (ElGamal, not plaintext)
 *
 * If a plaintext bet amount ever ends up in this code path,
 * that is a CRITICAL BUG. See SECURITY.md.
 */

export interface BetValidationRequest {
  marketId: number;
  side: 1 | 2; // 1=YES, 2=NO
  proofA: readonly [bigint, bigint];
  proofB: readonly [readonly [bigint, bigint], readonly [bigint, bigint]];
  proofC: readonly [bigint, bigint];
  publicSignals: readonly [bigint, bigint, bigint, bigint, bigint];
  encryptedBet: {
    c1: { x: bigint; y: bigint };
    c2: { x: bigint; y: bigint };
  };
}

export interface BetValidationResponse {
  valid: boolean;
  error?: string;
  marketAddress?: string;
}

/**
 * Validate a bet proof before on-chain submission.
 *
 * This runs server-side to catch malformed proofs BEFORE they waste gas.
 * The wallet builds the final calldata client-side. The current market
 * contract takes a payment amount alongside the encrypted payload, and that
 * value must not be sent through this privacy-preserving server action.
 */
export async function validateBetProof(
  request: BetValidationRequest
): Promise<BetValidationResponse> {
  try {
    const { marketId, side, proofA, proofB, proofC, publicSignals, encryptedBet } = request;

    // 1. Validate side
    if (side !== 1 && side !== 2) {
      return { valid: false, error: "Invalid side. Must be 1 (YES) or 2 (NO)." };
    }

    // 2. Validate public signals structure
    if (publicSignals.length !== 5) {
      return { valid: false, error: "Invalid public signals. Expected 5 elements." };
    }
    if (proofB.length !== 2 || proofB.some((point) => point.length !== 2)) {
      return { valid: false, error: "Invalid proof B. Expected two coordinate pairs." };
    }

    // 3. Validate proof points are non-zero
    if (
      (proofA[0] === 0n && proofA[1] === 0n) ||
      (proofC[0] === 0n && proofC[1] === 0n)
    ) {
      return { valid: false, error: "Invalid proof points (zero points rejected)." };
    }

    // 4. Validate encrypted bet is well-formed
    // c1 = (0, 1) is the identity point — an encryption of 0 with random=0, which is invalid
    if (encryptedBet.c1.x === 0n && encryptedBet.c1.y === 1n) {
      return { valid: false, error: "Invalid encrypted bet ciphertext (identity point)." };
    }

    // 5. Get market contract address from Supabase
    const { data: market, error: marketError } = await supabase
      .from("markets")
      .select("contract_address, status")
      .eq("market_id", marketId)
      .single();

    if (marketError || !market) {
      return { valid: false, error: `Market ${marketId} not found.` };
    }

    if (market.status !== "active") {
      return {
        valid: false,
        error: `Market is not active (status: ${market.status}).`,
      };
    }

    return {
      valid: true,
      marketAddress: market.contract_address,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Validation failed: ${String(error)}`,
    };
  }
}

/**
 * Record a successful bet placement in Supabase.
 *
 * Called AFTER the transaction is confirmed on-chain.
 * Creates a position commitment (NO amounts stored).
 */
export async function recordBetPlacement(params: {
  marketId: number;
  userId: string;
  side: 1 | 2;
  nullifier: string;
  commitmentHash: string;
  transactionHash: string;
  blockNumber: number;
}) {
  const { error } = await supabase.from("position_commitments").upsert(
    {
      user_id: params.userId,
      market_id: params.marketId,
      commitment_hash: params.commitmentHash,
      nullifier: params.nullifier,
      side: params.side,
      block_number: params.blockNumber,
      transaction_hash: params.transactionHash,
    },
    { onConflict: "nullifier" }
  );

  if (error) {
    console.error("Failed to record bet:", error);
    return { success: false, error: error.message };
  }

  // Add to activity feed
  await supabase.from("market_activity").insert({
    market_id: params.marketId,
    event_type: "bet_placed",
    description: "New encrypted bet placed",
    metadata: {
      side: params.side === 1 ? "YES" : "NO",
      // NO amounts stored — this is the security invariant
    },
  });

  return { success: true };
}

/**
 * Prepare registration calldata for the VeilRegistry.
 *
 * The user derives their BabyJubJub public key client-side from a wallet
 * signature. This action just validates the key format and prepares the
 * calldata to call VeilRegistry.register().
 */
export async function prepareRegistration(
  publicKeyX: bigint,
  publicKeyY: bigint
): Promise<{ valid: boolean; error?: string; calldata?: `0x${string}` }> {
  // Validate: x cannot be 0, and (x=0, y=1) is the identity point
  if (publicKeyX === 0n) {
    return { valid: false, error: "Invalid public key (x cannot be zero)." };
  }
  if (publicKeyX === 0n && publicKeyY === 1n) {
    return { valid: false, error: "Invalid public key (identity point)." };
  }

  const VEIL_REGISTRY_ABI = [
    {
      type: "function",
      name: "register",
      inputs: [
        { name: "publicKeyX", type: "uint256" },
        { name: "publicKeyY", type: "uint256" },
      ],
      outputs: [],
      stateMutability: "nonpayable",
    },
  ] as const;

  const calldata = encodeFunctionData({
    abi: VEIL_REGISTRY_ABI,
    functionName: "register",
    args: [publicKeyX, publicKeyY],
  });

  return { valid: true, calldata };
}
