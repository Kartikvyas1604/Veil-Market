"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { cn, formatNumber } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { CipherText } from "@/components/cipher-text";
import { StampButton } from "@/components/stamp-button";

export default function ResolutionPage() {
  const [isUnsealing, setIsUnsealing] = useState(false);
  const [isUnsealed, setIsUnsealed] = useState(false);

  const handleUnseal = useCallback(() => {
    setIsUnsealing(true);
    setTimeout(() => {
      setIsUnsealed(true);
      setIsUnsealing(false);
    }, 1200);
  }, []);

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <div className="relative mx-auto max-w-3xl px-4 pt-16 pb-20 md:px-6 md:pt-24 lg:px-8">
        <div className="text-center">
          {/* Status */}
          <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
            <span className="inline-block font-mono text-[10px] tracking-[0.3em] text-text-muted uppercase">
              Settlement · Case No. 2026-AVAX-004
            </span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 font-serif text-3xl text-text-primary md:text-4xl lg:text-5xl stagger-enter" style={{ animationDelay: "100ms" }}>
            {isUnsealed ? "Declassified" : "Awaiting Decryption"}
          </h1>

          <p className="mb-12 max-w-lg mx-auto text-sm text-text-muted stagger-enter" style={{ animationDelay: "200ms" }}>
            {isUnsealed
              ? "Your position has been decrypted. The outcome and your return are now visible."
              : "The settlement oracle has confirmed the outcome. Click below to decrypt your position."}
          </p>

          {/* Resolution card */}
          <div className="mx-auto max-w-md rounded-sm border border-border bg-surface-raised p-8 text-left stagger-enter" style={{ animationDelay: "300ms" }}>
            <div className="mb-6 space-y-4">
              <div>
                <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Market</div>
                <div className="font-serif text-sm text-text-primary">Bitcoin exceeds $150K before Q1 2026</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Your Direction</div>
                  {isUnsealed ? (
                    <CipherText text="YES" isRevealing={isUnsealed} duration={1000} />
                  ) : (
                    <div className="redaction-bar h-5 w-12 rounded-sm" />
                  )}
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Position Size</div>
                  {isUnsealed ? (
                    <CipherText text="$5,400.00" isRevealing={isUnsealed} duration={1000} />
                  ) : (
                    <div className="redaction-bar h-5 w-20 rounded-sm" />
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Outcome</div>
                {isUnsealed ? (
                  <div className="font-serif text-xl font-bold text-text-primary">
                    <CipherText text="YES — 62% Final" isRevealing={isUnsealed} duration={1000} />
                  </div>
                ) : (
                  <div className="redaction-bar h-6 w-32 rounded-sm" />
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Your Return</div>
                {isUnsealed ? (
                  <div className="font-mono text-2xl font-bold tabular-nums text-text-primary">
                    <CipherText text="$8,709.68" isRevealing={isUnsealed} duration={1000} />
                  </div>
                ) : (
                  <div className="redaction-bar h-8 w-28 rounded-sm" />
                )}
              </div>

              {isUnsealed && (
                <div className="border-t border-border pt-4" style={{ animation: "contrast-snap 400ms ease-out" }}>
                  <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Net P&L</div>
                  <div className="font-mono text-lg font-bold tabular-nums text-text-primary">+$3,309.68</div>
                </div>
              )}
            </div>

            {!isUnsealed && (
              <StampButton variant="light" className="w-full" onClick={handleUnseal} disabled={isUnsealing}>
                {isUnsealing ? "Decrypting..." : "Unseal Position"}
              </StampButton>
            )}

            {isUnsealed && (
              <Link href="/portfolio" className="block">
                <StampButton variant="ghost" className="w-full">
                  View in Portfolio →
                </StampButton>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
