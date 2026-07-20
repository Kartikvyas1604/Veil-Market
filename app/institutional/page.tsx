"use client";

import { GridBg } from "@/components/grid-bg";
import { StampButton } from "@/components/stamp-button";

export default function InstitutionalPage() {
  return (
    <div className="relative min-h-screen bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full pointer-events-none" />

      <main id="main-content" className="relative mx-auto max-w-4xl px-4 pt-16 pb-20 md:px-6 md:pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-12 stagger-enter" style={{ animationDelay: "0ms" }}>
          <span className="mb-3 inline-block font-mono text-[10px] tracking-[0.3em] text-text-muted uppercase">
            Institutional Access
          </span>
          <h1 className="font-serif text-3xl text-text-primary md:text-4xl">
            Permissioned Tier
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
            Higher limits, dedicated infrastructure, and regulatory compliance
            for institutional participants. Operates on a dedicated Avalanche
            subnet.
          </p>
        </div>

        {/* KYC entry */}
        <div className="mb-12 rounded-sm border border-border bg-surface-raised p-8 stagger-enter" style={{ animationDelay: "100ms" }}>
          <h2 className="mb-4 font-serif text-xl text-text-primary">Identity Verification</h2>
          <p className="mb-6 text-sm text-text-muted">
            Institutional tier requires KYC verification through our identity
            partner. This is a one-time process that enables permissioned access.
          </p>

          <div className="mb-6 space-y-3">
            {[
              { step: "1", label: "Submit entity documentation" },
              { step: "2", label: "Verify authorized signers" },
              { step: "3", label: "Receive permissioned wallet" },
              { step: "4", label: "Access institutional tier" },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-border-strong font-mono text-[10px] text-text-secondary">
                  {item.step}
                </div>
                <span className="font-mono text-xs text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>

          <StampButton variant="light">Begin Verification</StampButton>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            { title: "Higher Position Limits", desc: "Up to $1M per position with institutional-grade encryption parameters." },
            { title: "Dedicated Decryptors", desc: "Private decryptor network with SLA guarantees and faster settlement." },
            { title: "Portfolio Privacy", desc: "Cross-market position privacy — correlation between bets is also hidden." },
            { title: "Audit Trail", desc: "Regulatory-compliant audit trail with selective disclosure capabilities." },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-sm border border-border bg-surface-raised p-6 stagger-enter"
              style={{ animationDelay: `${200 + i * 60}ms` }}
            >
              <h3 className="mb-2 font-serif text-base text-text-primary">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Subnet info */}
        <div className="mt-12 rounded-sm border border-border/50 bg-surface/50 p-6 stagger-enter" style={{ animationDelay: "400ms" }}>
          <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
            Subnet Configuration
          </h3>
          <div className="space-y-2.5">
            {[
              { label: "Subnet", value: "VEIL-INST-001" },
              { label: "Consensus", value: "Snowman++" },
              { label: "Validator Count", value: "12 (permissioned)" },
              { label: "Block Time", value: "< 1s" },
              { label: "Encryption Standard", value: "AES-256-GCM + ElGamal" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between font-mono text-[11px]">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-text-secondary">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
