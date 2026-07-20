"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { CipherText } from "@/components/cipher-text";
import { SealBadge } from "@/components/seal-badge";
import { OddsTicker } from "@/components/odds-ticker";
import { Countdown } from "@/components/countdown";
import { getMarket } from "@/lib/markets";
import { notFound } from "next/navigation";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const market = getMarket(id);

  if (!market) {
    notFound();
  }

  const [isRevealed, setIsRevealed] = useState(
    market.status === "resolved"
  );
  const [isDecrypting, setIsDecrypting] = useState(false);

  const handleReveal = useCallback(() => {
    setIsDecrypting(true);
    // Simulate decryption delay
    setTimeout(() => {
      setIsRevealed(true);
      setIsDecrypting(false);
    }, 1200);
  }, []);

  const isLive = market.status === "live";

  return (
    <div className="relative min-h-screen">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-16 md:px-6 md:pt-12 lg:px-8">
        {/* Breadcrumb */}
        <div
          className="mb-8 stagger-enter"
          style={{ animationDelay: "0ms" }}
        >
          <Link
            href="/markets"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-veil-text-muted transition-colors duration-150 hover:text-veil-text-dim"
          >
            ← Back to Markets
          </Link>
        </div>

        {/* Header */}
        <div
          className="mb-8 stagger-enter"
          style={{ animationDelay: "50ms" }}
        >
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-veil-text-muted uppercase">
              {market.category}
            </span>
            <span className="h-1 w-1 rounded-full bg-veil-border-strong" />
            <SealBadge
              status={
                isRevealed || market.status === "resolved"
                  ? "revealed"
                  : "sealed"
              }
            />
          </div>

          <h1 className="font-serif text-2xl leading-snug text-veil-text-bright md:text-3xl lg:text-4xl">
            {market.question}
          </h1>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Odds + Pool */}
          <div className="lg:col-span-2 space-y-6">
            {/* Odds panel */}
            <div
              className="rounded-lg border border-veil-border bg-veil-surface/50 p-6 stagger-enter"
              style={{ animationDelay: "100ms" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                  {isRevealed ? "Final Odds" : "Live Odds"}
                </span>
                {isLive && !isRevealed && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-veil-success animate-pulse" />
                    <span className="font-mono text-[10px] text-veil-text-muted">
                      Computing
                    </span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <OddsTicker
                    value={isRevealed ? market.yesOdds : market.yesOdds}
                    label="YES"
                    size="lg"
                    animated={isRevealed}
                  />
                  <div className="mt-3 font-mono text-xs text-veil-text-muted">
                    Pool:{" "}
                    <span className="text-veil-text-dim">
                      ${formatNumber(market.yesPool)}
                    </span>
                  </div>
                </div>
                <div>
                  <OddsTicker
                    value={isRevealed ? market.noOdds : market.noOdds}
                    label="NO"
                    size="lg"
                    animated={isRevealed}
                  />
                  <div className="mt-3 font-mono text-xs text-veil-text-muted">
                    Pool:{" "}
                    <span className="text-veil-text-dim">
                      ${formatNumber(market.noPool)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pool bar */}
              <div className="mt-6">
                <div className="mb-1.5 flex justify-between font-mono text-[10px] text-veil-text-muted">
                  <span>Total Pool</span>
                  <span>${formatNumber(market.totalPool)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-veil-elevated">
                  <div
                    className="h-full rounded-full bg-veil-accent/40 transition-all duration-1000"
                    style={{
                      width: `${market.yesOdds * 100}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-veil-text-muted">
                  <span>YES side</span>
                  <span>NO side</span>
                </div>
              </div>
            </div>

            {/* Position panel (encrypted) */}
            <div
              className="rounded-lg border border-veil-border bg-veil-surface/50 p-6 stagger-enter"
              style={{ animationDelay: "200ms" }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                  Your Position
                </span>
                <SealBadge
                  status={
                    isRevealed || market.status === "resolved"
                      ? "revealed"
                      : "sealed"
                  }
                />
              </div>

              {isRevealed || market.status === "resolved" ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-veil-text-dim">
                      Direction
                    </span>
                    <span
                      className={cn(
                        "font-mono text-lg font-bold",
                        market.resolvedOutcome === "yes"
                          ? "text-veil-success"
                          : "text-veil-danger"
                      )}
                    >
                      <CipherText
                        text={
                          market.resolvedOutcome === "yes" ? "YES" : "NO"
                        }
                        isRevealing={isDecrypting || isRevealed}
                        duration={1000}
                      />
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-veil-text-dim">
                      Position Size
                    </span>
                    <CipherText
                      text="$2,450.00"
                      isRevealing={isDecrypting || isRevealed}
                      duration={1000}
                    />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-veil-text-dim">
                      Potential Return
                    </span>
                    <CipherText
                      text="$3,951.61"
                      isRevealing={isDecrypting || isRevealed}
                      duration={1000}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {["Direction", "Position Size", "Potential Return"].map(
                    (label) => (
                      <div
                        key={label}
                        className="flex items-baseline justify-between"
                      >
                        <span className="font-mono text-sm text-veil-text-dim">
                          {label}
                        </span>
                        <span className="font-mono text-sm text-veil-sealed">
                          █████████
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-6">
            {/* Action card */}
            <div
              className="rounded-lg border border-veil-border bg-veil-surface/50 p-6 stagger-enter"
              style={{ animationDelay: "150ms" }}
            >
              {isLive && !isRevealed ? (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                      Time Remaining
                    </span>
                    <div className="mt-1">
                      <Countdown
                        endDate={market.endDate}
                        className="text-lg"
                      />
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-veil-text-muted">Total Pool</span>
                      <span className="text-veil-text-dim">
                        ${formatNumber(market.totalPool)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-veil-text-muted">Positions</span>
                      <span className="text-veil-text-dim">
                        {Math.floor(market.totalPool / 120).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReveal}
                    disabled={isDecrypting}
                    className={cn(
                      "w-full rounded-md py-2.5 font-mono text-xs font-semibold tracking-wide transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg",
                      isDecrypting
                        ? "bg-veil-surface text-veil-text-muted cursor-wait"
                        : "bg-veil-accent text-veil-bg hover:bg-veil-accent/90"
                    )}
                  >
                    {isDecrypting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-veil-text-muted border-t-transparent" />
                        Decrypting...
                      </span>
                    ) : (
                      "Simulate Resolution"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                      Resolved Outcome
                    </span>
                    <div className="mt-1">
                      <span
                        className={cn(
                          "font-mono text-lg font-bold",
                          market.resolvedOutcome === "yes"
                            ? "text-veil-success"
                            : "text-veil-danger"
                        )}
                      >
                        {market.resolvedOutcome?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-veil-text-muted">Final Pool</span>
                      <span className="text-veil-text-dim">
                        ${formatNumber(market.totalPool)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-veil-text-muted">Resolved</span>
                      <span className="text-veil-text-dim">
                        {market.resolutionDate
                          ? new Date(market.resolutionDate).toLocaleDateString()
                          : "Recently"}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Encryption info */}
            <div
              className="rounded-lg border border-veil-border/50 bg-veil-surface/30 p-6 stagger-enter"
              style={{ animationDelay: "250ms" }}
            >
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                Encryption Status
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Protocol", value: "eERC (ElGamal)" },
                  { label: "Key Pair", value: "256-bit ECC" },
                  { label: "Verification", value: "ZK-SNARK" },
                  { label: "Chain", value: "Avalanche C-Chain" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between font-mono text-[11px]"
                  >
                    <span className="text-veil-text-muted">{item.label}</span>
                    <span className="text-veil-text-dim">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
