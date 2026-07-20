"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { SealBadge } from "@/components/seal-badge";
import { getUserPositionsWithMarkets } from "@/lib/actions/markets";
import type { DbPositionCommitment, MarketWithOdds } from "@/lib/supabase";

import { useAccount } from "wagmi";

type EnrichedPosition = DbPositionCommitment & { market: MarketWithOdds | null };

export default function PortfolioPage() {
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { address: walletAddress } = useAccount();

  useEffect(() => {
    async function load() {
      if (!walletAddress) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await getUserPositionsWithMarkets(walletAddress);
        setPositions(data);
      } catch (err) {
        console.error("Failed to load positions:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [walletAddress]);

  // Derive stats
  const activePositions = positions.filter((p) => p.market?.status === "active");
  const resolvedPositions = positions.filter(
    (p) => p.market?.status === "resolved" || p.market?.status === "disputed"
  );

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-5xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        {/* Header */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <h1 className="font-serif text-3xl text-text-primary md:text-4xl">Portfolio</h1>
          <p className="mt-2 font-mono text-xs text-text-muted">
            Your positions — decrypted locally, visible only to you. Amounts are NOT stored on-chain.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 stagger-enter" style={{ animationDelay: "50ms" }}>
          {[
            { label: "Active Positions", value: activePositions.length.toString() },
            { label: "Resolved", value: resolvedPositions.length.toString() },
            { label: "Total Volume", value: "Encrypted" },
            { label: "P&L", value: "Encrypted" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-sm border border-border bg-surface-raised p-4">
              <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">{stat.label}</div>
              <div className={cn("mt-1 font-mono text-lg font-bold tabular-nums",
                stat.value === "Encrypted" ? "text-text-muted opacity-50" : "text-text-primary"
              )}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
           <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="mb-4 font-mono text-4xl text-text-muted animate-pulse">⧗</div>
             <p className="font-serif text-lg text-text-secondary">Syncing wallet commitments...</p>
           </div>
        ) : positions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-sm">
            <div className="mb-4 font-mono text-4xl text-text-muted">∅</div>
            <p className="font-serif text-lg text-text-secondary">No positions found</p>
            <p className="mt-1 font-mono text-xs text-text-muted">You haven&apos;t placed any encrypted bets yet.</p>
            <Link href="/markets" className="mt-6 font-mono text-xs text-text-primary underline hover:text-veil-500">
              Browse Markets →
            </Link>
          </div>
        ) : (
          <>
            {/* Active Positions */}
            {activePositions.length > 0 && (
              <div className="mb-12">
                <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "100ms" }}>
                  Active Positions ({activePositions.length})
                </h2>
                <div className="space-y-3">
                  {activePositions.map((pos, i) => (
                    <Link
                      key={pos.id}
                      href={`/market/${pos.market_id}`}
                      className={cn(
                        "flex items-center justify-between rounded-sm border border-border bg-surface-raised p-4 transition-colors duration-150 hover:border-border-strong",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
                        "stagger-enter"
                      )}
                      style={{ animationDelay: `${120 + i * 60}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SealBadge status="sealed" />
                          <span className="font-mono text-xs text-text-muted">{pos.side === 1 ? "YES" : "NO"}</span>
                        </div>
                        <p className="truncate font-serif text-sm text-text-primary">{pos.market?.question || `Market #${pos.market_id}`}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-mono text-sm tabular-nums text-text-muted opacity-50">Encrypted</div>
                        <div className="font-mono text-[10px] text-text-muted">Wait for resolution</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Positions */}
            {resolvedPositions.length > 0 && (
              <div>
                <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "200ms" }}>
                  Resolved ({resolvedPositions.length})
                </h2>
                <div className="space-y-3">
                  {resolvedPositions.map((pos, i) => (
                    <Link
                      key={pos.id}
                      href={`/market/${pos.market_id}`}
                      className="flex items-center justify-between rounded-sm border border-border/50 bg-surface-raised/50 p-4 opacity-70 stagger-enter hover:opacity-100 transition-opacity"
                      style={{ animationDelay: `${220 + i * 60}ms` }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SealBadge status="revealed" />
                          <span className="font-mono text-xs text-text-muted">{pos.side === 1 ? "YES" : "NO"}</span>
                        </div>
                        <p className="truncate font-serif text-sm text-text-secondary">{pos.market?.question || `Market #${pos.market_id}`}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="font-mono text-sm tabular-nums text-text-muted opacity-50">Decrypt to View</div>
                        <div className={cn("font-mono text-[10px] text-text-muted")}>
                          Outcome: {pos.market?.outcome?.toUpperCase()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
