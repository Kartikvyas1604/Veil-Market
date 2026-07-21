"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn, formatNumber, getMarketUrgency } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { SealBadge } from "@/components/seal-badge";
import { OddsTicker } from "@/components/odds-ticker";
import { Countdown } from "@/components/countdown";
import { getUserPositionsWithMarkets } from "@/lib/actions/markets";
import type { DbPositionCommitment, MarketWithOdds } from "@/lib/supabase";
import { useAccount } from "wagmi";

type EnrichedPosition = DbPositionCommitment & { market: MarketWithOdds | null };

function PositionCard({ position, index }: { position: EnrichedPosition; index: number }) {
  const market = position.market;
  const isLive = market?.status === "active";
  const isResolved = market?.status === "resolved" || market?.status === "disputed";
  const side = position.side === 1 ? "YES" : "NO";
  const yesOddsNorm = (market?.yes_odds ?? 50) / 100;
  const noOddsNorm = (market?.no_odds ?? 50) / 100;
  const resolutionMs = market ? new Date(market.resolution_time).getTime() : 0;
  const urgency = market ? getMarketUrgency(resolutionMs, market.total_pool) : "low";

  return (
    <Link
      href={`/market/${position.market_id}`}
      className={cn(
        "group block rounded-sm border transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900",
        isLive
          ? "border-border hover:border-border-strong bg-surface-raised"
          : "border-border/50 bg-surface-raised/50 opacity-70 hover:opacity-100",
        "stagger-enter"
      )}
      style={{ animationDelay: `${80 + index * 60}ms` }}
    >
      <div className="p-4 md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <SealBadge
              status={isResolved ? "revealed" : "sealed"}
              urgency={isResolved ? "normal" : urgency}
            />
            <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
              {market?.category ?? "Market"}
            </span>
          </div>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] uppercase",
              position.side === 1
                ? "border-text-primary/20 text-text-primary"
                : "border-border-strong text-text-secondary"
            )}
          >
            {side}
          </span>
        </div>

        <h3 className="mb-4 font-serif text-sm leading-snug text-text-primary line-clamp-2 md:text-base">
          {market?.question ?? `Market #${position.market_id}`}
        </h3>

        <div className="mb-3 flex items-end gap-6">
          <OddsTicker
            value={yesOddsNorm}
            label="Yes"
            size="sm"
            animated={false}
            redacted={isLive && !isResolved}
          />
          <OddsTicker
            value={noOddsNorm}
            label="No"
            size="sm"
            animated={false}
            redacted={isLive && !isResolved}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-muted">
              Pool{" "}
              <span className="text-text-secondary font-semibold">
                ${formatNumber(market?.total_pool ?? 0)}
              </span>
            </span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <span className="font-mono text-xs text-text-muted">
              {market?.total_bets ?? 0} bets
            </span>
          </div>
          {isLive ? (
            <Countdown endDate={resolutionMs} />
          ) : isResolved ? (
            <span className="font-mono text-xs text-text-secondary">
              {market?.outcome?.toUpperCase() ?? "—"}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function PortfolioPage() {
  const [positions, setPositions] = useState<EnrichedPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { address: walletAddress, isConnected } = useAccount();

  useEffect(() => {
    let cancelled = false;
    async function fetchPositions() {
      if (!walletAddress) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const data = await getUserPositionsWithMarkets(walletAddress);
        if (!cancelled) setPositions(data);
      } catch (err) {
        console.error("Failed to load positions:", err);
        if (!cancelled) setError("Failed to load positions. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchPositions();
    return () => { cancelled = true; };
  }, [walletAddress, refreshKey]);

  const activePositions = positions.filter((p) => p.market?.status === "active");
  const resolvedPositions = positions.filter(
    (p) => p.market?.status === "resolved" || p.market?.status === "disputed"
  );
  const pendingPositions = positions.filter(
    (p) => p.market?.status === "resolution_pending"
  );

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-5xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between stagger-enter" style={{ animationDelay: "0ms" }}>
          <div>
            <h1 className="font-serif text-3xl text-text-primary md:text-4xl">Portfolio</h1>
            <p className="mt-2 font-mono text-xs text-text-muted">
              {isConnected
                ? "Your encrypted positions — visible only to you."
                : "Connect your wallet to view encrypted positions."}
            </p>
          </div>
          {isConnected && !isLoading && (
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase transition-colors hover:text-text-secondary"
            >
              Refresh
            </button>
          )}
        </div>

        {/* Not connected */}
        {!isConnected && (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-sm stagger-enter" style={{ animationDelay: "50ms" }}>
            <div className="mb-4 font-mono text-4xl text-text-muted">⬙</div>
            <p className="font-serif text-lg text-text-secondary">Wallet not connected</p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              Connect your wallet to view your encrypted positions.
            </p>
            <Link
              href="/markets"
              className="mt-6 font-mono text-xs text-text-primary underline hover:text-veil-500"
            >
              Browse Markets →
            </Link>
          </div>
        )}

        {/* Connected but loading */}
        {isConnected && isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 font-mono text-4xl text-text-muted animate-pulse">⧗</div>
            <p className="font-serif text-lg text-text-secondary">Syncing wallet commitments...</p>
          </div>
        )}

        {/* Connected, loaded, error */}
        {isConnected && !isLoading && error && (
          <div className="flex flex-col items-center justify-center border border-red-400/30 bg-red-400/5 py-24 text-center rounded-sm">
            <p className="font-serif text-lg text-text-secondary">Unable to load positions</p>
            <p className="mt-2 font-mono text-xs text-text-muted">{error}</p>
            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="mt-4 font-mono text-xs text-text-primary underline hover:text-veil-500"
            >
              Retry
            </button>
          </div>
        )}

        {/* Connected, loaded, empty */}
        {isConnected && !isLoading && !error && positions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-sm">
            <div className="mb-4 font-mono text-4xl text-text-muted">∅</div>
            <p className="font-serif text-lg text-text-secondary">No positions found</p>
            <p className="mt-1 font-mono text-xs text-text-muted">
              You haven&apos;t placed any encrypted bets yet.
            </p>
            <Link
              href="/markets"
              className="mt-6 rounded-sm border border-border bg-surface-raised px-6 py-2.5 font-mono text-xs font-medium text-text-primary transition-colors hover:bg-surface-elevated"
            >
              Browse Markets
            </Link>
          </div>
        )}

        {/* Connected, loaded, has positions */}
        {isConnected && !isLoading && !error && positions.length > 0 && (
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 stagger-enter" style={{ animationDelay: "50ms" }}>
              {[
                { label: "Active", value: activePositions.length, accent: false },
                { label: "Pending", value: pendingPositions.length, accent: false },
                { label: "Resolved", value: resolvedPositions.length, accent: false },
                { label: "Total", value: positions.length, accent: false },
              ].map((stat) => (
                <div key={stat.label} className="rounded-sm border border-border bg-surface-raised p-4">
                  <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                    {stat.label}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold tabular-nums text-text-primary">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Active Positions */}
            {activePositions.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "100ms" }}>
                  Active Positions ({activePositions.length})
                </h2>
                <div className="space-y-3">
                  {activePositions.map((pos, i) => (
                    <PositionCard key={pos.id} position={pos} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Resolution */}
            {pendingPositions.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "150ms" }}>
                  Pending Resolution ({pendingPositions.length})
                </h2>
                <div className="space-y-3">
                  {pendingPositions.map((pos, i) => (
                    <PositionCard key={pos.id} position={pos} index={i} />
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
                    <PositionCard key={pos.id} position={pos} index={i} />
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
