"use client";

import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { SealBadge } from "@/components/seal-badge";
import { Countdown } from "@/components/countdown";

interface Position {
  id: string;
  market: string;
  direction: "YES" | "NO";
  amount: number;
  currentReturn: number;
  status: "sealed" | "resolved";
  pnl?: number;
  outcome?: "win" | "loss";
}

const positions: Position[] = [
  { id: "1", market: "Federal Reserve rate cut January 2026", direction: "YES", amount: 2450, currentReturn: 3951.61, status: "sealed" },
  { id: "2", market: "Bitcoin exceeds $150K before Q1 2026", direction: "NO", amount: 5400, currentReturn: 9152.54, status: "sealed" },
  { id: "3", market: "SpaceX Starship orbital mission by March 2026", direction: "YES", amount: 3200, currentReturn: 4383.56, status: "sealed" },
  { id: "4", market: "El Salvador Bitcoin reserve increase", direction: "YES", amount: 1800, currentReturn: 0, status: "resolved", pnl: -1800, outcome: "loss" },
  { id: "5", market: "AVAX exceeds $50 by end of Q2 2026", direction: "NO", amount: 890, currentReturn: 1271.43, status: "sealed" },
];

const sealedPositions = positions.filter((p) => p.status === "sealed");
const resolvedPositions = positions.filter((p) => p.status === "resolved");
const totalInvested = positions.reduce((sum, p) => sum + p.amount, 0);
const totalPnl = positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0);

export default function PortfolioPage() {
  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-16 md:px-6 md:pt-14 lg:px-8">
        {/* Header */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <h1 className="font-serif text-3xl text-text-primary md:text-4xl">Portfolio</h1>
          <p className="mt-2 font-mono text-xs text-text-muted">Your positions — decrypted locally, visible only to you</p>
        </div>

        {/* Summary */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 stagger-enter" style={{ animationDelay: "50ms" }}>
          {[
            { label: "Total Invested", value: `$${formatNumber(totalInvested)}` },
            { label: "Active Positions", value: sealedPositions.length.toString() },
            { label: "Resolved", value: resolvedPositions.length.toString() },
            { label: "P&L", value: totalPnl >= 0 ? `+$${formatNumber(Math.abs(totalPnl))}` : `-$${formatNumber(Math.abs(totalPnl))}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-sm border border-border bg-surface-raised p-4">
              <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">{stat.label}</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Active Positions */}
        <div className="mb-12">
          <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "100ms" }}>
            Active Positions ({sealedPositions.length})
          </h2>
          <div className="space-y-3">
            {sealedPositions.map((pos, i) => (
              <Link
                key={pos.id}
                href={`/market/${pos.id}`}
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
                    <span className="font-mono text-xs text-text-muted">{pos.direction}</span>
                  </div>
                  <p className="truncate font-serif text-sm text-text-primary">{pos.market}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="font-mono text-sm tabular-nums text-text-primary">${formatNumber(pos.amount)}</div>
                  <div className="font-mono text-[10px] text-text-muted">Potential: ${formatNumber(pos.currentReturn)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Resolved Positions */}
        <div>
          <h2 className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase stagger-enter" style={{ animationDelay: "200ms" }}>
            Resolved ({resolvedPositions.length})
          </h2>
          <div className="space-y-3">
            {resolvedPositions.map((pos, i) => (
              <div
                key={pos.id}
                className="flex items-center justify-between rounded-sm border border-border/50 bg-surface-raised/50 p-4 opacity-70 stagger-enter"
                style={{ animationDelay: `${220 + i * 60}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <SealBadge status="revealed" />
                    <span className="font-mono text-xs text-text-muted">{pos.direction}</span>
                  </div>
                  <p className="truncate font-serif text-sm text-text-secondary">{pos.market}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="font-mono text-sm tabular-nums text-text-secondary">${formatNumber(pos.amount)}</div>
                  <div className={cn("font-mono text-[10px]", pos.outcome === "win" ? "text-text-primary" : "text-text-muted")}>
                    {pos.pnl !== undefined ? (pos.pnl >= 0 ? `+$${formatNumber(pos.pnl)}` : `-$${formatNumber(Math.abs(pos.pnl))}`) : "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
