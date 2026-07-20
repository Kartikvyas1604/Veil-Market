import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-service-key";

// ─── Public client (for client components) ────────────────────────────────

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Server client (service role — for server actions and API routes) ─────
// NEVER expose this to the browser. Service role bypasses RLS.

export function createSupabaseServerClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

// ─── Types mirroring the database schema ─────────────────────────────────

export type MarketStatus = "active" | "resolution_pending" | "resolved" | "disputed";
export type Outcome = "none" | "yes" | "no";

export interface DbMarket {
  id: string;
  market_id: number;
  contract_address: string;
  question: string;
  category: string;
  resolution_time: string;
  min_bet: number;
  max_bet: number;
  status: MarketStatus;
  outcome: Outcome;
  created_at: string;
  updated_at: string;
}

export interface DbOddsSnapshot {
  id: string;
  market_id: number;
  round: number;
  yes_total: number;
  no_total: number;
  total_bets: number;
  yes_odds: number;
  no_odds: number;
  published_at: string;
}

export interface DbPositionCommitment {
  id: string;
  user_id: string;
  market_id: number;
  commitment_hash: string;
  nullifier: string;
  side: 1 | 2;
  block_number: number;
  transaction_hash: string;
  created_at: string;
}

export interface DbMarketActivity {
  id: string;
  market_id: number;
  event_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Enriched market with latest odds (returned by get_markets_with_odds function)
export interface MarketWithOdds {
  market_id: number;
  contract_address: string;
  question: string;
  category: string;
  resolution_time: string;
  status: MarketStatus;
  outcome: Outcome;
  yes_odds: number;
  no_odds: number;
  total_pool: number;
  total_bets: number;
}
