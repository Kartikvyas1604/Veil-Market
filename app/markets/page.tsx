"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { MarketCard } from "@/components/market-card";
import { getMarkets } from "@/lib/actions/markets";
import type { MarketWithOdds } from "@/lib/supabase";

type Filter = "all" | "active" | "resolved";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
];

// Adapter to map DbMarket to the Market type expected by MarketCard
function mapToCardMarket(dbMarket: MarketWithOdds) {
  return {
    id: dbMarket.market_id.toString(),
    question: dbMarket.question,
    category: dbMarket.category,
    status: dbMarket.status === "active" ? "live" : dbMarket.status,
    totalPool: dbMarket.total_pool || 0,
    yesOdds: dbMarket.yes_odds / 100, // Assuming 0-100 from DB
    noOdds: dbMarket.no_odds / 100,
    endDate: new Date(dbMarket.resolution_time).getTime(),
    resolvedOutcome: dbMarket.outcome === "none" ? undefined : dbMarket.outcome,
  };
}

export default function MarketsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [dbMarkets, setDbMarkets] = useState<MarketWithOdds[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadMarkets() {
      try {
        const data = await getMarkets();
        setDbMarkets(data);
      } catch (err) {
        console.error("Failed to load markets:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMarkets();
  }, []);

  const filtered = dbMarkets
    .filter((m) => {
      if (filter === "all") return true;
      if (filter === "active") return m.status === "active";
      if (filter === "resolved") return m.status === "resolved" || m.status === "disputed";
      return true;
    })
    // Map to the component interface
    .map(mapToCardMarket)
    .sort((a, b) => b.totalPool - a.totalPool);

  const leadMarket = filtered[0];
  const restMarkets = filtered.slice(1);

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl text-text-primary md:text-4xl">
                Markets
              </h1>
              <p className="mt-2 font-mono text-xs text-text-muted">
                {isLoading ? "Loading markets..." : `${filtered.length} market${filtered.length !== 1 ? "s" : ""} · Positions encrypted until settlement`}
              </p>
            </div>
            <span className="hidden font-mono text-[10px] tracking-[0.2em] text-text-muted/40 uppercase md:block">
              Case Files — Active
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mb-8 flex gap-1 stagger-enter" style={{ animationDelay: "80ms" }} role="tablist" aria-label="Filter markets">
          {filters.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "relative rounded-sm px-4 py-2 font-mono text-xs tracking-wide transition-colors duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
                filter === f.key
                  ? "text-text-primary bg-surface-raised"
                  : "text-text-muted hover:text-text-secondary"
              )}
            >
              {f.label}
              {filter === f.key && (
                <span className="absolute bottom-0 left-2 right-2 h-px bg-text-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Market grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 font-mono text-4xl text-text-muted animate-pulse">⧗</div>
            <p className="font-serif text-lg text-text-secondary">Syncing ledger...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {/* Lead market — featured */}
            {leadMarket && (
              <MarketCard key={leadMarket.id} market={leadMarket as any} index={0} featured />
            )}
            {/* Rest in standard grid */}
            {restMarkets.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {restMarkets.map((market, i) => (
                  <MarketCard key={market.id} market={market as any} index={i + 1} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 font-mono text-4xl text-text-muted">∅</div>
            <p className="font-serif text-lg text-text-secondary">No markets match this filter</p>
            <p className="mt-1 font-mono text-xs text-text-muted">Check back later or browse all markets</p>
          </div>
        )}
      </main>
    </div>
  );
}
