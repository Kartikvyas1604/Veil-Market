"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DbMarketActivity } from "@/lib/supabase";

interface OddsData {
  yesOdds: number;
  noOdds: number;
  yesTotal: number;
  noTotal: number;
  totalBets: number;
  publishedAt: string | null;
}

interface MarketWithOdds {
  marketId: number;
  contractAddress: string;
  question: string;
  category: string;
  resolutionTime: string;
  status: string;
  outcome: string;
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  totalBets: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

/**
 * Hook to subscribe to real-time odds updates via Supabase Realtime
 */
export function useOddsUpdates(marketId: number) {
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial odds
    const fetchOdds = async () => {
      const { data, error } = await supabase.rpc("get_latest_odds", {
        p_market_id: marketId,
      });

      if (error) console.error("Failed to load odds:", error.message);
      if (data && data.length > 0) {
        const row = asRecord(data[0]);
        setOdds({
          yesOdds: Number(row.yes_odds),
          noOdds: Number(row.no_odds),
          yesTotal: Number(row.yes_total),
          noTotal: Number(row.no_total),
          totalBets: Number(row.total_bets),
          publishedAt: typeof row.published_at === "string" ? row.published_at : null,
        });
      }
      setLoading(false);
    };

    fetchOdds();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`odds:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "odds_snapshots",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const newOdds = asRecord(payload.new);
            setOdds({
              yesOdds: Number(newOdds.yes_odds),
              noOdds: Number(newOdds.no_odds),
              yesTotal: Number(newOdds.yes_total),
              noTotal: Number(newOdds.no_total),
              totalBets: Number(newOdds.total_bets),
              publishedAt: typeof newOdds.published_at === "string" ? newOdds.published_at : null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  return { odds, loading };
}

/**
 * Hook to get all markets with odds
 */
export function useMarkets() {
  const [markets, setMarkets] = useState<MarketWithOdds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      const { data, error } = await supabase.rpc("get_markets_with_odds");

      if (error) console.error("Failed to load markets:", error.message);
      if (data) {
        setMarkets(
          data.map((item: unknown) => {
            const market = asRecord(item);
            return {
              marketId: Number(market.market_id),
              contractAddress: String(market.contract_address),
              question: String(market.question),
              category: String(market.category),
              resolutionTime: String(market.resolution_time),
              status: String(market.status),
              outcome: String(market.outcome),
              yesOdds: Number(market.yes_odds),
              noOdds: Number(market.no_odds),
              totalPool: Number(market.total_pool),
              totalBets: Number(market.total_bets),
            };
          })
        );
      }
      setLoading(false);
    };

    fetchMarkets();

    // Subscribe to market updates
    const channel = supabase
      .channel("markets")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "markets",
        },
        () => {
          // Re-fetch markets on any change
          fetchMarkets();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "odds_snapshots",
        },
        () => {
          // Re-fetch when odds update
          fetchMarkets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { markets, loading };
}

/**
 * Hook to get activity feed for a market
 */
export function useMarketActivity(marketId: number) {
  const [activities, setActivities] = useState<DbMarketActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data, error } = await supabase
        .from("market_activity")
        .select("*")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) console.error("Failed to load market activity:", error.message);
      if (data) {
        setActivities(data as DbMarketActivity[]);
      }
      setLoading(false);
    };

    fetchActivity();

    const channel = supabase
      .channel(`activity:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "market_activity",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as DbMarketActivity, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  return { activities, loading };
}
