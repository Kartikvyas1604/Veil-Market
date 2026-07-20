"use client";

import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { SealBadge } from "./seal-badge";
import { OddsTicker } from "./odds-ticker";
import { Countdown } from "./countdown";
import type { Market } from "@/lib/markets";

interface MarketCardProps {
  market: Market;
  index?: number;
}

export function MarketCard({ market, index = 0 }: MarketCardProps) {
  const isLive = market.status === "live";

  return (
    <Link
      href={`/market/${market.id}`}
      className={cn(
        "group relative block rounded-lg border p-5 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg",
        "min-h-[44px]",
        isLive
          ? "border-veil-border hover:border-veil-border-strong hover:bg-veil-surface/50"
          : "border-veil-border/50 opacity-75 hover:opacity-100",
        "stagger-enter"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top row: category + badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.15em] text-veil-text-muted uppercase">
          {market.category}
        </span>
        <SealBadge
          status={market.status === "resolved" ? "revealed" : "sealed"}
        />
      </div>

      {/* Question */}
      <h3 className="mb-4 font-serif text-lg leading-snug text-veil-text-bright line-clamp-2">
        {market.question}
      </h3>

      {/* Odds row */}
      <div className="mb-4 flex items-end justify-between">
        <div className="flex gap-6">
          <OddsTicker
            value={market.yesOdds}
            label="Yes"
            size="sm"
            animated={false}
          />
          <OddsTicker
            value={market.noOdds}
            label="No"
            size="sm"
            animated={false}
          />
        </div>
      </div>

      {/* Bottom row: pool + countdown */}
      <div className="flex items-center justify-between border-t border-veil-border pt-3">
        <span className="font-mono text-xs text-veil-text-muted">
          Pool{" "}
          <span className="text-veil-text-dim">
            ${formatNumber(market.totalPool)}
          </span>
        </span>
        {isLive ? (
          <Countdown endDate={market.endDate} />
        ) : (
          <span className="font-mono text-xs text-veil-accent/70">
            Resolved: {market.resolvedOutcome?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Hover glow */}
      {isLive && (
        <div className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-veil-accent/[0.03] to-transparent" />
        </div>
      )}
    </Link>
  );
}
