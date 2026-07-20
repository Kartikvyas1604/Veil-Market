"use server";

import { supabase } from "@/lib/supabase";
import type { MarketWithOdds, DbOddsSnapshot, DbMarket, DbMarketActivity, DbPositionCommitment } from "@/lib/supabase";

/**
 * Server Actions for market data fetching.
 * These run as React Server Components / Server Actions.
 * All data comes from Supabase (the fast-read mirror of on-chain state).
 */

// ─── Market Listing ──────────────────────────────────────────────────────

/**
 * Get all markets with their latest odds.
 * Used by the market listing page (RSC — no client-side fetch).
 */
export async function getMarkets(): Promise<MarketWithOdds[]> {
  const { data, error } = await supabase.rpc("get_markets_with_odds");

  if (error) {
    console.error("getMarkets error:", error);
    // Fall back to direct query
    const { data: fallback } = await supabase
      .from("markets")
      .select("*")
      .order("created_at", { ascending: false });

    return (fallback || []).map((m: DbMarket) => ({
      market_id: m.market_id,
      contract_address: m.contract_address,
      question: m.question,
      category: m.category,
      resolution_time: m.resolution_time,
      status: m.status,
      outcome: m.outcome,
      yes_odds: 50,
      no_odds: 50,
      total_pool: 0,
      total_bets: 0,
    }));
  }

  return data || [];
}

/**
 * Get markets by status
 */
export async function getMarketsByStatus(
  status: "active" | "resolved" | "disputed"
): Promise<MarketWithOdds[]> {
  const all = await getMarkets();
  return all.filter((m) => m.status === status);
}

/**
 * Get markets by category
 */
export async function getMarketsByCategory(category: string): Promise<MarketWithOdds[]> {
  const all = await getMarkets();
  return all.filter((m) => m.category.toLowerCase() === category.toLowerCase());
}

// ─── Single Market ────────────────────────────────────────────────────────

/**
 * Get a single market by market_id with latest odds.
 */
export async function getMarket(marketId: number): Promise<MarketWithOdds | null> {
  const { data: market, error } = await supabase
    .from("markets")
    .select("*")
    .eq("market_id", marketId)
    .single();

  if (error || !market) return null;

  // Get latest odds snapshot from the table
  const { data: odds } = await supabase
    .from("odds_snapshots")
    .select("yes_total, no_total, total_bets")
    .eq("market_id", marketId)
    .order("round", { ascending: false })
    .limit(1)
    .maybeSingle() as { data: { yes_total: number; no_total: number; total_bets: number } | null };

  const yesTotal = odds?.yes_total ?? 50;
  const noTotal = odds?.no_total ?? 50;
  const totalPool = yesTotal + noTotal;

  return {
    market_id: market.market_id,
    contract_address: market.contract_address,
    question: market.question,
    category: market.category,
    resolution_time: market.resolution_time,
    status: market.status,
    outcome: market.outcome,
    yes_odds: totalPool > 0 ? (yesTotal / totalPool) * 100 : 50,
    no_odds: totalPool > 0 ? (noTotal / totalPool) * 100 : 50,
    total_pool: totalPool,
    total_bets: odds?.total_bets ?? 0,
  };
}

// ─── Odds History ─────────────────────────────────────────────────────────

/**
 * Get the full odds history for a market (for charting).
 */
export async function getMarketOddsHistory(
  marketId: number,
  limit = 50
): Promise<DbOddsSnapshot[]> {
  const { data, error } = await supabase
    .from("odds_snapshots")
    .select("*")
    .eq("market_id", marketId)
    .order("round", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getMarketOddsHistory error:", error);
    return [];
  }

  return (data as DbOddsSnapshot[]) || [];
}

/**
 * Get the latest odds snapshot for a market.
 */
export async function getLatestOdds(marketId: number): Promise<DbOddsSnapshot | null> {
  const history = await getMarketOddsHistory(marketId, 1);
  return history[0] ?? null;
}

// ─── Activity Feed ────────────────────────────────────────────────────────

/**
 * Get recent activity for a market (for the market detail page sidebar).
 */
export async function getMarketActivity(
  marketId: number,
  limit = 20
): Promise<DbMarketActivity[]> {
  const { data, error } = await supabase
    .from("market_activity")
    .select("*")
    .eq("market_id", marketId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getMarketActivity error:", error);
    return [];
  }

  return (data as DbMarketActivity[]) || [];
}

/**
 * Get site-wide recent activity (for the homepage activity feed).
 */
export async function getRecentActivity(limit = 30): Promise<DbMarketActivity[]> {
  const { data, error } = await supabase
    .from("market_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as DbMarketActivity[]) || [];
}

// ─── Portfolio / User Positions ───────────────────────────────────────────

/**
 * Get position commitments for a wallet address.
 *
 * SECURITY INVARIANT: position commitments contain ONLY:
 *   - Which market the user bet in
 *   - Which side (YES/NO)
 *   - The nullifier (proves they placed a bet, not the amount)
 *
 * No amounts are stored. This is architecturally enforced by the schema.
 */
export async function getUserPositions(
  walletAddress: string
): Promise<DbPositionCommitment[]> {
  // Look up user by wallet address
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("wallet_address", walletAddress.toLowerCase())
    .single();

  if (userError || !user) return [];

  const { data, error } = await supabase
    .from("position_commitments")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserPositions error:", error);
    return [];
  }

  return (data as DbPositionCommitment[]) || [];
}

/**
 * Get user positions enriched with market info (for the portfolio page).
 */
export async function getUserPositionsWithMarkets(walletAddress: string): Promise<
  Array<DbPositionCommitment & { market: MarketWithOdds | null }>
> {
  const positions = await getUserPositions(walletAddress);
  if (positions.length === 0) return [];

  // Batch-fetch all relevant markets
  const marketIds = [...new Set(positions.map((p) => p.market_id))];
  const markets = await Promise.all(marketIds.map(getMarket));
  const marketMap = new Map(
    markets.filter(Boolean).map((m) => [m!.market_id, m!])
  );

  return positions.map((p) => ({
    ...p,
    market: marketMap.get(p.market_id) ?? null,
  }));
}

// ─── Search ───────────────────────────────────────────────────────────────

/**
 * Full-text search over market questions.
 * This is one of the legitimate use cases for Supabase — chains are
 * genuinely bad at full-text search.
 */
export async function searchMarkets(query: string): Promise<DbMarket[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase
    .from("markets")
    .select("*")
    .textSearch("question", query, { type: "websearch", config: "english" })
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("searchMarkets error:", error);
    return [];
  }

  return (data as DbMarket[]) || [];
}
