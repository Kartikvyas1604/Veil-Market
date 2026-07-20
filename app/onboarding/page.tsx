"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { GridBg } from "@/components/grid-bg";
import { CipherText } from "@/components/cipher-text";
import { StampButton } from "@/components/stamp-button";

type Step = "connect" | "generating" | "keys" | "ready";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("connect");

  const handleConnect = useCallback(() => {
    setStep("generating");
    setTimeout(() => setStep("keys"), 2000);
  }, []);

  const handleConfirm = useCallback(() => {
    setStep("ready");
  }, []);

  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <div className="relative mx-auto max-w-lg px-4 pt-16 pb-20 md:px-6 md:pt-24 lg:px-8">
        <div className="text-center">
          {/* Header */}
          <div className="mb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
            <span className="inline-block font-mono text-[10px] tracking-[0.3em] text-text-muted uppercase">
              Wallet Setup · eERC Key Generation
            </span>
          </div>

          <h1 className="mb-4 font-serif text-3xl text-text-primary md:text-4xl stagger-enter" style={{ animationDelay: "100ms" }}>
            {step === "ready" ? "Ready" : "Generate Encryption Keys"}
          </h1>

          <p className="mb-12 text-sm text-text-muted stagger-enter" style={{ animationDelay: "200ms" }}>
            {step === "connect" && "Connect your wallet and generate an encryption key pair. This key encrypts your positions — it never leaves your device."}
            {step === "generating" && "Generating your ElGamal key pair..."}
            {step === "keys" && "Your encryption keys have been generated. Review them below."}
            {step === "ready" && "Your encryption key is active. You can now place encrypted positions."}
          </p>

          {/* Step indicator */}
          <div className="mb-8 flex justify-center gap-2 stagger-enter" style={{ animationDelay: "250ms" }}>
            {(["connect", "generating", "keys", "ready"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 w-8 rounded-full transition-colors duration-300",
                  (step === "connect" && i <= 0) ||
                  (step === "generating" && i <= 1) ||
                  (step === "keys" && i <= 2) ||
                  (step === "ready")
                    ? "bg-text-primary"
                    : "bg-surface-elevated"
                )}
              />
            ))}
          </div>

          {/* Card */}
          <div className="rounded-sm border border-border bg-surface-raised p-8 text-left stagger-enter" style={{ animationDelay: "300ms" }}>
            {step === "connect" && (
              <>
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border-strong font-mono text-[10px] text-text-secondary">1</div>
                    <span className="font-mono text-xs text-text-secondary">Connect MetaMask or Rabby wallet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border font-mono text-[10px] text-text-muted">2</div>
                    <span className="font-mono text-xs text-text-muted">Generate ElGamal key pair</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border font-mono text-[10px] text-text-muted">3</div>
                    <span className="font-mono text-xs text-text-muted">Sign encryption commitment</span>
                  </div>
                </div>
                <StampButton variant="light" className="w-full" onClick={handleConnect}>
                  Connect Wallet
                </StampButton>
              </>
            )}

            {step === "generating" && (
              <div className="py-8 text-center">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-border-strong">
                  <span className="font-mono text-sm text-text-primary animate-pulse">Gen</span>
                </div>
                <div className="font-mono text-xs text-text-muted">Generating ElGamal key pair...</div>
                <div className="mt-4 mx-auto max-w-xs">
                  <div className="h-1 rounded-full bg-surface-elevated overflow-hidden">
                    <div className="h-full bg-text-muted/50 animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            )}

            {step === "keys" && (
              <>
                <div className="mb-6 space-y-4">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Public Key</div>
                    <div className="rounded-sm bg-surface-elevated p-3 font-mono text-xs text-text-secondary break-all">
                      0x7a3F8b2C9d1E4f5A6b7C8d9E0f1A2b3C4d5E6f7A
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Encrypted Private Key</div>
                    <div className="rounded-sm bg-surface-elevated p-3">
                      <CipherText text="a8F2c9D1e4B5a6C7d8E9f0A1b2C3d4E5f6A7b8C9" isRevealing={false} />
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-text-muted">Stored encrypted on your device. Never transmitted.</p>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-1">Key Fingerprint</div>
                    <div className="font-mono text-xs text-text-secondary">VEIL-ECC-256-7a3f8b2c</div>
                  </div>
                </div>
                <StampButton variant="light" className="w-full" onClick={handleConfirm}>
                  Confirm & Activate
                </StampButton>
              </>
            )}

            {step === "ready" && (
              <>
                <div className="mb-6 py-4 text-center">
                  <div className="mb-3 font-mono text-lg text-text-primary">Keys Active</div>
                  <p className="font-mono text-xs text-text-muted">Your encryption key is ready. All positions will be encrypted client-side using this key.</p>
                </div>
                <Link href="/markets" className="block">
                  <StampButton variant="light" className="w-full">
                    Browse Markets →
                  </StampButton>
                </Link>
              </>
            )}
          </div>

          {/* Security note */}
          <div className="mt-8 rounded-sm border border-border/50 bg-surface/50 p-4 text-left stagger-enter" style={{ animationDelay: "400ms" }}>
            <div className="font-mono text-[10px] tracking-[0.15em] text-text-muted uppercase mb-2">Security Note</div>
            <p className="font-mono text-[11px] leading-relaxed text-text-muted">
              Your private encryption key is generated client-side using the
              WebCrypto API. It is encrypted with your wallet signature before
              storage. The VEIL protocol never has access to your plaintext
              private key.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
