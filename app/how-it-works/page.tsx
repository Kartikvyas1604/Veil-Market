"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";

const steps = [
  {
    num: "01",
    title: "User generates encryption key",
    body: "When you connect your wallet, VEIL generates an ElGamal key pair tied to your address. This key encrypts your bet — nobody, not even the protocol, can read it without your decryption key.",
    visual: (
      <div className="rounded-sm border border-border bg-surface-elevated p-6 font-mono text-xs text-text-muted">
        <div className="mb-2 text-[10px] tracking-[0.2em] text-text-muted uppercase">Key Generation</div>
        <div className="space-y-1">
          <div><span className="text-text-muted">pub:</span> 0x7a3f...e2b1</div>
          <div><span className="text-text-muted">enc:</span> <span className="encrypted-text">████████████████</span></div>
          <div><span className="text-text-muted">sig:</span> <span className="encrypted-text">████████████████</span></div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    title: "Position is sealed on-chain",
    body: "Your bet (direction + amount) is encrypted client-side using your public key, then submitted to the smart contract. The contract stores ciphertext — the plaintext never leaves your device.",
    visual: (
      <div className="rounded-sm border border-border bg-surface-elevated p-6">
        <div className="mb-2 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">Sealed Position</div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between"><span className="text-text-muted">Direction</span><span className="encrypted-text">████████</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Amount</span><span className="encrypted-text">████████</span></div>
          <div className="flex justify-between"><span className="text-text-muted">Timestamp</span><span className="text-text-secondary">2026-01-15T14:30Z</span></div>
        </div>
      </div>
    ),
  },
  {
    num: "03",
    title: "Odds update via homomorphic computation",
    body: "The protocol adds encrypted positions together without decrypting them. The result is an encrypted aggregate that, when opened, reveals the market odds — but individual bets stay hidden.",
    visual: (
      <div className="rounded-sm border border-border bg-surface-elevated p-6 font-mono text-xs">
        <div className="mb-2 text-[10px] tracking-[0.2em] text-text-muted uppercase">Homomorphic Addition</div>
        <div className="space-y-1 text-text-muted">
          <div>Enc(Position_A) + Enc(Position_B) + ...</div>
          <div>= Enc(Aggregate)</div>
          <div className="mt-2 text-[10px] text-text-muted">Decryption reveals: YES 62% / NO 38%</div>
          <div className="text-[10px] text-text-muted">Individual positions: still encrypted</div>
        </div>
      </div>
    ),
  },
  {
    num: "04",
    title: "Market resolves — positions unseal",
    body: "When the outcome is determined, the settlement oracle triggers decryption of all positions. Your bet becomes visible, P&L is calculated, and winners claim rewards.",
    visual: (
      <div className="rounded-sm border border-border bg-surface-elevated p-6 font-mono text-xs">
        <div className="mb-2 text-[10px] tracking-[0.2em] text-text-muted uppercase">Resolution</div>
        <div className="space-y-1">
          <div className="text-text-secondary">Outcome: <span className="text-text-primary font-semibold">YES</span></div>
          <div className="text-text-secondary">Your bet: <span className="text-text-primary">YES $2,450</span></div>
          <div className="text-text-secondary">Return: <span className="text-text-primary font-semibold">$3,951.61</span></div>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksPage() {
  return (
    <div className="relative bg-veil-900">
      {/* Case file margin line */}
      <div className="case-file-margin case-file-margin--dark absolute left-[calc(50%-20rem)] top-0 bottom-0 hidden lg:block" aria-hidden="true" />

      <main id="main-content" className="mx-auto max-w-4xl px-4 pt-16 pb-20 md:px-6 md:pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-16 stagger-enter" style={{ animationDelay: "0ms" }}>
          <span className="mb-4 inline-block font-mono text-[10px] tracking-[0.3em] text-text-muted uppercase">
            Technical Overview
          </span>
          <h1 className="font-serif text-3xl leading-tight text-text-primary md:text-4xl lg:text-5xl">
            How Encrypted Prediction
            <br />
            <span className="italic">Markets Work</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted">
            A bet enters encrypted. The protocol computes odds without reading
            individual positions. Settlement decrypts everything simultaneously.
            Here&apos;s the flow.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div
              key={step.num}
              className="grid grid-cols-1 gap-8 md:grid-cols-[80px_1fr] stagger-enter"
              style={{ animationDelay: `${100 + i * 80}ms` }}
            >
              <div className="font-mono text-4xl font-bold text-veil-200">
                {step.num}
              </div>
              <div>
                <h2 className="mb-3 font-serif text-xl text-text-primary">
                  {step.title}
                </h2>
                <p className="mb-4 text-sm leading-relaxed text-text-muted">
                  {step.body}
                </p>
                {step.visual}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 border-t border-border pt-8 text-center">
          <Link
            href="/docs"
            className="font-mono text-xs text-text-muted transition-colors duration-150 hover:text-text-primary"
          >
            Read the full technical docs →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
