"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { CipherText } from "@/components/cipher-text";
import { SealBadge } from "@/components/seal-badge";
import { OddsTicker } from "@/components/odds-ticker";
import { Countdown } from "@/components/countdown";
import { StampButton } from "@/components/stamp-button";
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

  const [isRevealed, setIsRevealed] = useState(market.status === "resolved");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [betStep, setBetStep] = useState<"idle" | "encrypting" | "proof" | "sealed">("idle");

  const handleReveal = useCallback(() => {
    setIsDecrypting(true);
    setTimeout(() => {
      setShowFlash(true);
      setIsRevealed(true);
      setTimeout(() => setShowFlash(false), 300);
      setIsDecrypting(false);
    }, 1000);
  }, []);

  const handlePlaceBet = useCallback(() => {
    setBetStep("encrypting");
    setTimeout(() => {
      setBetStep("proof");
      setTimeout(() => {
        setBetStep("sealed");
      }, 800);
    }, 1200);
  }, []);

  const isLive = market.status === "live";

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      {/* Reveal flash */}
      {showFlash && (
        <div
          className="fixed inset-0 z-50 pointer-events-none bg-text-primary/5"
          style={{ animation: "contrast-snap 300ms ease-out forwards" }}
        />
      )}

      <div className="relative mx-auto max-w-4xl px-4 pt-8 pb-16 md:px-6 md:pt-12 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <Link href="/markets" className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted transition-colors duration-150 hover:text-text-secondary">
            ← Back to Markets
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "50ms" }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">{market.category}</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <SealBadge status={isRevealed || market.status === "resolved" ? "revealed" : "sealed"} />
          </div>
          <h1 className="font-serif text-2xl leading-snug text-text-primary md:text-3xl lg:text-4xl">
            {market.question}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Odds panel */}
            <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "100ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
                  {isRevealed ? "Final Odds" : "Live Odds"}
                </span>
                {isLive && !isRevealed && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse" />
                    <span className="font-mono text-[10px] text-text-muted">Computing</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <OddsTicker value={market.yesOdds} label="YES" size="lg" animated={isRevealed} redacted={isLive && !isRevealed} />
                  <div className="mt-3 font-mono text-xs text-text-muted">
                    Pool: <span className="text-text-secondary">${formatNumber(market.yesPool)}</span>
                  </div>
                </div>
                <div>
                  <OddsTicker value={market.noOdds} label="NO" size="lg" animated={isRevealed} redacted={isLive && !isRevealed} />
                  <div className="mt-3 font-mono text-xs text-text-muted">
                    Pool: <span className="text-text-secondary">${formatNumber(market.noPool)}</span>
                  </div>
                </div>
              </div>

              {/* Pool bar */}
              <div className="mt-6">
                <div className="mb-1.5 flex justify-between font-mono text-[10px] text-text-muted">
                  <span>Total Pool</span>
                  <span>${formatNumber(market.totalPool)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full rounded-full bg-text-muted/30 transition-all duration-1000" style={{ width: `${market.yesOdds * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
                  <span>YES side</span>
                  <span>NO side</span>
                </div>
              </div>
            </div>

            {/* Place Bet panel */}
            {isLive && !isRevealed && (
              <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "150ms" }}>
                <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
                  Place Position
                </div>

                {betStep === "sealed" ? (
                  <div className="py-4 text-center">
                    <div className="mb-2 font-mono text-lg text-text-primary">Position Sealed</div>
                    <p className="font-mono text-xs text-text-muted">Your encrypted position is now on-chain. Nobody can see your bet.</p>
                  </div>
                ) : betStep !== "idle" ? (
                  <div className="py-8 text-center">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border-strong">
                      <span className="font-mono text-sm text-text-primary animate-pulse">
                        {betStep === "encrypting" ? "Enc" : "Prf"}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-text-muted">
                      {betStep === "encrypting" ? "Encrypting position client-side..." : "Generating zero-knowledge proof..."}
                    </div>
                    <div className="mt-3 mx-auto max-w-xs">
                      <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
                        <div
                          className="h-full bg-text-muted/50 transition-all duration-1000"
                          style={{ width: betStep === "encrypting" ? "60%" : "90%" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      <button type="button" className="rounded-sm border border-text-primary/30 bg-text-primary/5 py-3 font-mono text-sm font-semibold text-text-primary transition-colors duration-150 hover:bg-text-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900">
                        YES
                      </button>
                      <button type="button" className="rounded-sm border border-border py-3 font-mono text-sm font-medium text-text-muted transition-colors duration-150 hover:border-border-strong hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900">
                        NO
                      </button>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="bet-amount" className="mb-1.5 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                        Amount (USDC)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">$</span>
                        <input id="bet-amount" type="text" defaultValue="1,000" className="w-full rounded-sm border border-border bg-surface-elevated py-2.5 pl-7 pr-4 font-mono text-sm text-text-primary outline-none transition-colors duration-150 focus:border-text-muted" />
                      </div>
                    </div>

                    <div className="mb-4 space-y-1.5">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-text-muted">Your odds</span>
                        <span className="text-text-secondary">{(market.yesOdds * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-text-muted">Potential return</span>
                        <span className="text-text-primary">${(1000 / market.yesOdds).toFixed(2)}</span>
                      </div>
                    </div>

                    <StampButton variant="light" className="w-full" onClick={handlePlaceBet}>
                      Seal Position
                    </StampButton>
                    <p className="mt-2 text-center font-mono text-[10px] text-text-muted">
                      Your bet will be encrypted on-chain.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Position panel */}
            <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "200ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Your Position</span>
                <SealBadge status={isRevealed || market.status === "resolved" ? "revealed" : "sealed"} />
              </div>

              {isRevealed || market.status === "resolved" ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-text-muted">Direction</span>
                    <span className="font-mono text-lg font-bold text-text-primary">
                      <CipherText text={market.resolvedOutcome === "yes" ? "YES" : "NO"} isRevealing={isDecrypting || isRevealed} duration={1000} />
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-text-muted">Position Size</span>
                    <CipherText text="$2,450.00" isRevealing={isDecrypting || isRevealed} duration={1000} />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-text-muted">Potential Return</span>
                    <CipherText text="$3,951.61" isRevealing={isDecrypting || isRevealed} duration={1000} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {["Direction", "Position Size", "Potential Return"].map((label) => (
                    <div key={label} className="flex items-baseline justify-between">
                      <span className="font-mono text-sm text-text-muted">{label}</span>
                      <span className="redaction-bar inline-block h-4 w-24 rounded-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "150ms" }}>
              {isLive && !isRevealed ? (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Time Remaining</span>
                    <div className="mt-1"><Countdown endDate={market.endDate} className="text-lg" /></div>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Total Pool</span>
                      <span className="text-text-secondary">${formatNumber(market.totalPool)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Positions</span>
                      <span className="text-text-secondary">{Math.floor(market.totalPool / 120).toLocaleString()}</span>
                    </div>
                  </div>
                  <StampButton variant="light" className="w-full" onClick={handleReveal} disabled={isDecrypting}>
                    {isDecrypting ? "Decrypting..." : "Simulate Resolution"}
                  </StampButton>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Resolved Outcome</span>
                    <div className="mt-1">
                      <span className="font-mono text-lg font-bold text-text-primary">{market.resolvedOutcome?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Final Pool</span>
                      <span className="text-text-secondary">${formatNumber(market.totalPool)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Encryption info */}
            <div className="rounded-sm border border-border/50 bg-surface/50 p-6 stagger-enter" style={{ animationDelay: "250ms" }}>
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Encryption Status</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Protocol", value: "eERC (ElGamal)" },
                  { label: "Key Pair", value: "256-bit ECC" },
                  { label: "Verification", value: "ZK-SNARK" },
                  { label: "Chain", value: "Avalanche C-Chain" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between font-mono text-[11px]">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="text-text-secondary">{item.value}</span>
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
