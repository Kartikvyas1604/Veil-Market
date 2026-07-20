"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { supabase } from "@/lib/supabase";

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

      if (data && data.length > 0) {
        setOdds(data[0]);
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
            const newOdds = payload.new as any;
            setOdds({
              yesOdds: newOdds.yes_odds,
              noOdds: newOdds.no_odds,
              yesTotal: newOdds.yes_total,
              noTotal: newOdds.no_total,
              totalBets: newOdds.total_bets,
              publishedAt: newOdds.published_at,
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

      if (data) {
        setMarkets(
          data.map((m: any) => ({
            marketId: m.market_id,
            contractAddress: m.contract_address,
            question: m.question,
            category: m.category,
            resolutionTime: m.resolution_time,
            status: m.status,
            outcome: m.outcome,
            yesOdds: m.yes_odds,
            noOdds: m.no_odds,
            totalPool: m.total_pool,
            totalBets: m.total_bets,
          }))
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
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      const { data, error } = await supabase
        .from("market_activity")
        .select("*")
        .eq("market_id", marketId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        setActivities(data);
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
          setActivities((prev) => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  return { activities, loading };
}
