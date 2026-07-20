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
  featured?: boolean;
}

export function MarketCard({ market, index = 0, featured = false }: MarketCardProps) {
  const isLive = market.status === "live";
  const urgency = getMarketUrgency(market.endDate, market.totalPool);

  return (
    <Link
      href={`/market/${market.id}`}
      className={cn(
        "group relative block rounded-sm border transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
        featured
          ? "border-border-strong border-t-2 p-6 hover:border-text-muted"
          : cn(
              "p-5",
              isLive
                ? "border-border hover:border-border-strong"
                : "border-border/50 opacity-70 hover:opacity-100"
            ),
        "stagger-enter"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Featured exhibit label */}
      {featured && (
        <span className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.2em] text-text-muted/50 uppercase">
          Exhibit
        </span>
      )}

      {/* Top row */}
      <div className="mb-3 flex items-center justify-between">
        <span className={cn(
          "font-mono tracking-[0.15em] text-text-muted uppercase",
          featured ? "text-[11px]" : "text-[10px]"
        )}>
          {market.category}
        </span>
        <SealBadge
          status={market.status === "resolved" ? "revealed" : "sealed"}
          urgency={market.status === "resolved" ? "normal" : urgency}
        />
      </div>

      {/* Question */}
      <h3 className={cn(
        "mb-4 font-serif leading-snug text-text-primary line-clamp-2",
        featured ? "text-xl md:text-2xl" : "text-lg"
      )}>
        {market.question}
      </h3>

      {/* Odds row */}
      <div className="mb-4 flex items-end justify-between">
        <div className={cn("flex", featured ? "gap-8" : "gap-6")}>
          {isLive ? (
            <>
              <OddsTicker value={market.yesOdds} label="Yes" size={featured ? "md" : "sm"} redacted />
              <OddsTicker value={market.noOdds} label="No" size={featured ? "md" : "sm"} redacted />
            </>
          ) : (
            <>
              <OddsTicker value={market.yesOdds} label="Yes" size={featured ? "md" : "sm"} animated={false} />
              <OddsTicker value={market.noOdds} label="No" size={featured ? "md" : "sm"} animated={false} />
            </>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className={cn(
          "font-mono text-text-muted",
          featured ? "text-sm" : "text-xs"
        )}>
          Pool{" "}
          <span className="text-text-secondary font-semibold">
            ${formatNumber(market.totalPool)}
          </span>
        </span>
        {isLive ? (
          <Countdown endDate={market.endDate} className={featured ? "text-sm" : undefined} />
        ) : (
          <span className="font-mono text-xs text-text-secondary">
            Resolved: {market.resolvedOutcome?.toUpperCase()}
          </span>
        )}
      </div>
    </Link>
  );
}
