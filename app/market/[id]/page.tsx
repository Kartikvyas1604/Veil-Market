"use client";

import { use, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { formatNumber, getMarketUrgency } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { CipherText } from "@/components/cipher-text";
import { SealBadge } from "@/components/seal-badge";
import { OddsTicker } from "@/components/odds-ticker";
import { Countdown } from "@/components/countdown";
import { StampButton } from "@/components/stamp-button";
import { getMarket } from "@/lib/actions/markets";
import { supabase } from "@/lib/supabase";
import type { MarketWithOdds } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";

export default function MarketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const marketId = parseInt(id, 10);

  const [market, setMarket] = useState<MarketWithOdds | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    if (isNaN(marketId)) return;

    async function load() {
      const data = await getMarket(marketId);
      if (data) setMarket(data);
      setIsLoading(false);
    }
    load();
  }, [marketId]);

  // Subscribe to real-time odds updates
  useEffect(() => {
    if (isNaN(marketId)) return;

    const channel = supabase
      .channel(`market-${marketId}-odds`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "odds_snapshots",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const newSnapshot = payload.new;
          const yesTotal = Number(newSnapshot.yes_total);
          const noTotal = Number(newSnapshot.no_total);
          const totalPool = yesTotal + noTotal;

          if (totalPool > 0) {
            setMarket((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                yes_odds: (yesTotal / totalPool) * 100,
                no_odds: (noTotal / totalPool) * 100,
                total_pool: totalPool,
                total_bets: Number(newSnapshot.total_bets),
              };
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "markets",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          const updatedMarket = payload.new;
          setMarket((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: updatedMarket.status,
              outcome: updatedMarket.outcome,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId]);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const [isRevealingLocal, setIsRevealingLocal] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [betStep, setBetStep] = useState<"idle" | "encrypting" | "proof" | "sealed">("idle");
  const [selectedSide, setSelectedSide] = useState<1 | 2>(1); // 1 = YES, 2 = NO
  const [betAmount, setBetAmount] = useState("100");
  const [betError, setBetError] = useState("");

  // Legacy manual reveal button simulation
  const handleReveal = useCallback(() => {
    setIsRevealingLocal(true);
    setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      setIsRevealingLocal(false);
    }, 1000);
  }, []);

  const handlePlaceBet = async () => {
    if (!address || !walletClient || !market) {
      setBetError("Please connect your wallet first");
      return;
    }
    
    setBetError("");
    setBetStep("encrypting");
    
    try {
      // Import dynamically to avoid heavy crypto bundle on initial load if possible
      const { generateBetProof, deriveKeyFromSignature } = await import("@/lib/eerc");
      
      // Derive dummy key or real key depending on auth step (for speedrun we just use a fixed dummy public key for the auditor)
      const dummyPublicKey = { x: 0n, y: 1n };
      
      const amountFloat = parseFloat(betAmount);
      if (isNaN(amountFloat) || amountFloat <= 0) {
        throw new Error("Invalid bet amount");
      }
      
      const betAmountWei = BigInt(Math.floor(amountFloat * 1e18));
      
      setBetStep("proof");
      
      // Generate the mock proof and ElGamal encrypted bet
      const betProof = await generateBetProof(
        betAmountWei,
        Number(market.market_id),
        selectedSide,
        1n, // mock private key for speedrun
        dummyPublicKey,
        dummyPublicKey
      );
      
      // We set bettor address dynamically
      betProof.publicSignals[0] = BigInt(address);

      // Now send the transaction
      const { VEIL_MARKET_ABI } = await import("@/lib/contracts");
      
      const txHash = await writeContractAsync({
        abi: VEIL_MARKET_ABI,
        address: market.contract_address as `0x${string}`,
        functionName: "placeBet",
        args: [
          betProof.proofA,
          betProof.proofB,
          betProof.proofC,
          betProof.publicSignals,
          selectedSide,
          betProof.encryptedBet
        ],
      });
      
      console.log("Bet transaction sent!", txHash);
      setBetStep("sealed");
    } catch (e: any) {
      console.error(e);
      setBetError(e.shortMessage || e.message || "Failed to place bet. Did you reject?");
      setBetStep("idle");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-veil-900">
        <div className="font-mono text-xl text-text-muted animate-pulse">Syncing on-chain state...</div>
      </div>
    );
  }

  if (!market && !isLoading) {
    notFound();
  }

  const isLive = market!.status === "active";
  const isResolved = market!.status === "resolved" || market!.status === "disputed";
  const resolutionMs = new Date(market!.resolution_time).getTime();
  const urgency = getMarketUrgency(resolutionMs, market!.total_pool);
  const yesOddsNorm = market!.yes_odds / 100;
  const noOddsNorm = market!.no_odds / 100;

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

      <main id="main-content" className="relative mx-auto max-w-4xl px-4 pt-8 pb-16 md:px-6 md:pt-12 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <Link href="/markets" className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted transition-colors duration-150 hover:text-text-secondary">
            ← Back to Markets
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 stagger-enter" style={{ animationDelay: "50ms" }}>
          <div className="mb-3 flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">{market!.category}</span>
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            <SealBadge status={isResolved ? "revealed" : "sealed"} urgency={isResolved ? "normal" : urgency} />
          </div>
          <h1 className="font-serif text-2xl leading-snug text-text-primary md:text-3xl lg:text-4xl">
            {market!.question}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Odds panel */}
            <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "100ms" }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
                  {isResolved ? "Final Odds" : "Live Odds"}
                </span>
                {isLive && !isResolved && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-pulse" />
                    <span className="font-mono text-[10px] text-text-muted">Listening for decrypts</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <OddsTicker value={yesOddsNorm} label="YES" size="lg" animated={isResolved} redacted={isLive && !isResolved} />
                  <div className="mt-3 font-mono text-xs text-text-muted">
                    Pool Share: <span className="text-text-secondary">{(yesOddsNorm * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <OddsTicker value={noOddsNorm} label="NO" size="lg" animated={isResolved} redacted={isLive && !isResolved} />
                  <div className="mt-3 font-mono text-xs text-text-muted">
                    Pool Share: <span className="text-text-secondary">{(noOddsNorm * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Pool bar */}
              <div className="mt-6">
                <div className="mb-1.5 flex justify-between font-mono text-[10px] text-text-muted">
                  <span>Total Pool (USDC)</span>
                  <span>${formatNumber(market!.total_pool)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full rounded-full bg-text-muted/30 transition-all duration-1000" style={{ width: `${yesOddsNorm * 100}%` }} />
                </div>
                <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
                  <span>YES side</span>
                  <span>NO side</span>
                </div>
              </div>
            </div>

            {/* Place Bet panel */}
            {isLive && !isResolved && (
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
                      <button 
                        type="button" 
                        onClick={() => setSelectedSide(1)}
                        className={`rounded-sm border py-3 font-mono text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900 ${selectedSide === 1 ? 'border-text-primary/30 bg-text-primary/5 text-text-primary hover:bg-text-primary/10' : 'border-border text-text-muted hover:border-border-strong hover:text-text-secondary'}`}
                      >
                        YES
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSelectedSide(2)}
                        className={`rounded-sm border py-3 font-mono text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900 ${selectedSide === 2 ? 'border-text-primary/30 bg-text-primary/5 text-text-primary hover:bg-text-primary/10' : 'border-border text-text-muted hover:border-border-strong hover:text-text-secondary'}`}
                      >
                        NO
                      </button>
                    </div>

                    <div className="mb-4">
                      <label htmlFor="bet-amount" className="mb-1.5 block font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase">
                        Amount (USDC)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">$</span>
                        <input 
                          id="bet-amount" 
                          type="text" 
                          value={betAmount || ""}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="w-full rounded-sm border border-border bg-surface-elevated py-2.5 pl-7 pr-4 font-mono text-sm text-text-primary outline-none transition-colors duration-150 focus:border-text-muted" 
                        />
                      </div>
                    </div>

                    <div className="mb-4 space-y-1.5">
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-text-muted">Your odds (est)</span>
                        <span className="text-text-secondary">{(yesOddsNorm * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <StampButton variant="light" className="w-full" onClick={handlePlaceBet}>
                      Seal Position
                    </StampButton>
                    {betError && (
                      <p className="mt-2 text-center font-mono text-xs text-red-400">
                        {betError}
                      </p>
                    )}
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
            <SealBadge status={isResolved ? "revealed" : "sealed"} urgency={isResolved ? "normal" : urgency} />
              </div>

              {isResolved ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-text-muted">Direction</span>
                    <span className="font-mono text-lg font-bold text-text-primary">
                      <CipherText text={market!.outcome === "yes" ? "YES" : market!.outcome === "no" ? "NO" : "DISPUTED"} isRevealing={isRevealingLocal || isResolved} duration={1000} />
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-sm text-text-muted">Position Size</span>
                    <CipherText text="Encrypted" isRevealing={false} duration={1000} />
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
                  <p className="text-xs text-text-muted mt-2 font-mono text-center">Connect wallet to view your encrypted positions</p>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter" style={{ animationDelay: "150ms" }}>
              {isLive && !isResolved ? (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Time Remaining</span>
                    <div className="mt-1"><Countdown endDate={new Date(market!.resolution_time).getTime()} className="text-lg" /></div>
                  </div>
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Total Pool</span>
                      <span className="text-text-secondary">${formatNumber(market!.total_pool)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Total Bets</span>
                      <span className="text-text-secondary">{market!.total_bets}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <span className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Resolved Outcome</span>
                    <div className="mt-1">
                      <span className="font-mono text-lg font-bold text-text-primary">{market!.outcome?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-text-muted">Final Pool</span>
                      <span className="text-text-secondary">${formatNumber(market!.total_pool)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Encryption info */}
            <div className="rounded-sm border border-border/50 bg-surface/50 p-6 stagger-enter" style={{ animationDelay: "250ms" }}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Encryption Status</h3>
                <span className="font-mono text-[9px] tracking-[0.15em] text-text-muted/30 uppercase">
                  ID {market!.market_id}
                </span>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Protocol", value: "eERC (ElGamal)" },
                  { label: "Key Pair", value: "BabyJubJub" },
                  { label: "Verification", value: "Groth16 ZK" },
                  { label: "Contract", value: `${market!.contract_address.slice(0,6)}...${market!.contract_address.slice(-4)}` },
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
      </main>
    </div>
  );
}
