"use client";

import Link from "next/link";
import { cn, formatNumber, getMarketUrgency } from "@/lib/utils";
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
  const urgency = getMarketUrgency(market.endDate, market.totalPool);

  return (
    <Link
      href={`/market/${market.id}`}
      className={cn(
        "group relative block rounded-sm border p-5 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
        isLive
          ? "border-border hover:border-border-strong"
          : "border-border/50 opacity-70 hover:opacity-100",
        "stagger-enter"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
          {market.category}
        </span>
        <SealBadge
          status={market.status === "resolved" ? "revealed" : "sealed"}
          urgency={market.status === "resolved" ? "normal" : urgency}
        />
      </div>

      {/* Question */}
      <h3 className="mb-4 font-serif text-lg leading-snug text-text-primary line-clamp-2">
        {market.question}
      </h3>

      {/* Odds row */}
      <div className="mb-4 flex items-end justify-between">
        <div className="flex gap-6">
          {isLive ? (
            <>
              <OddsTicker value={market.yesOdds} label="Yes" size="sm" redacted />
              <OddsTicker value={market.noOdds} label="No" size="sm" redacted />
            </>
          ) : (
            <>
              <OddsTicker value={market.yesOdds} label="Yes" size="sm" animated={false} />
              <OddsTicker value={market.noOdds} label="No" size="sm" animated={false} />
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-xs text-text-muted">
          Pool{" "}
          <span className="text-text-secondary">
            ${formatNumber(market.totalPool)}
          </span>
        </span>
        {isLive ? (
          <Countdown endDate={market.endDate} />
        ) : (
          <span className="font-mono text-xs text-text-secondary">
            Resolved: {market.resolvedOutcome?.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}
