"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { MarketCard } from "@/components/market-card";
import { markets, getLiveMarkets, getResolvedMarkets } from "@/lib/markets";

type Filter = "all" | "live" | "resolved";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "resolved", label: "Resolved" },
];

export default function MarketsPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? markets
      : filter === "live"
        ? getLiveMarkets()
        : getResolvedMarkets();

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-7xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <h1 className="font-serif text-3xl text-text-primary md:text-4xl">
            Markets
          </h1>
          <p className="mt-2 font-mono text-xs text-text-muted">
            {filtered.length} market{filtered.length !== 1 ? "s" : ""} · Positions encrypted until settlement
          </p>
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
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((market, i) => (
              <MarketCard key={market.id} market={market} index={i} />
            ))}
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
