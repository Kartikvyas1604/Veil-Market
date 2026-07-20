"use client";

import Link from "next/link";
import { GridBg } from "@/components/grid-bg";
import { Scanline } from "@/components/scanline";
import { StatsBar } from "@/components/stats-bar";
import { MarketCard } from "@/components/market-card";
import { RecentActivity } from "@/components/recent-activity";
import { Footer } from "@/components/footer";
import { getLiveMarkets, markets } from "@/lib/markets";

const liveMarkets = getLiveMarkets();
const sortedByVolume = [...liveMarkets].sort((a, b) => b.totalPool - a.totalPool);
const leadMarket = sortedByVolume[0];
const restMarkets = sortedByVolume.slice(1, 4);
const totalVolume = markets.reduce((sum, m) => sum + m.totalPool, 0);
const activeMarkets = getLiveMarkets().length;
const sealedPositions = 12847;

export default function Home() {
  return (
    <div className="relative bg-veil-900">
      <GridBg className="fixed inset-0 h-full w-full opacity-30" />

      {/* Case file margin line — continuous through all sections */}
      <div className="case-file-margin case-file-margin--dark absolute left-[calc(50%-38rem)] top-0 bottom-0 hidden lg:block" aria-hidden="true" />

      <main id="main-content">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Scanline />
        {/* Exhibit stamp — marginalia */}
        <div className="exhibit-stamp absolute top-20 right-8 border-border text-text-muted hidden md:block" aria-hidden="true">
          Exhibit A
        </div>
        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-32 md:pb-24 lg:px-8">
          {/* Case file tag */}
          <div className="mb-8 flex justify-center stagger-enter" style={{ animationDelay: "0ms" }}>
            <span className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface-elevated/50 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
              Case No. 2026-AVAX — Encrypted
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 text-center font-serif text-4xl leading-[1.05] text-text-primary md:text-5xl lg:text-[3.5rem] stagger-enter"
            style={{ animationDelay: "100ms" }}
          >
            Your positions,
            <br />
            <span className="italic">withheld until settlement</span>
          </h1>

          {/* Subhead */}
          <p
            className="mx-auto mb-10 max-w-xl text-center text-base text-text-muted md:text-lg stagger-enter"
            style={{ animationDelay: "200ms" }}
          >
            Encrypted bets on real-world outcomes. Nobody sees your direction or
            size — but the protocol computes live aggregate odds via homomorphic
            encryption.
          </p>

          {/* CTA */}
          <div className="flex justify-center gap-4 stagger-enter" style={{ animationDelay: "300ms" }}>
            <Link
              href="/markets"
              className="stamp-btn inline-flex h-11 items-center rounded-sm border border-text-primary bg-text-primary px-6 font-mono text-xs font-semibold tracking-wide text-surface transition-colors duration-100 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900"
            >
              Enter App
            </Link>
            <Link
              href="/how-it-works"
              className="stamp-btn inline-flex h-11 items-center rounded-sm border border-border px-6 font-mono text-xs font-medium tracking-wide text-text-secondary transition-colors duration-100 hover:border-text-primary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-900"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Tick-mark divider: Hero → Stats */}
      <div className="section-divider mx-4 md:mx-6 lg:mx-8" aria-hidden="true" />

      {/* Stats */}
      <section className="relative bg-surface-elevated/50">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
          <StatsBar
            stats={[
              { label: "Total Volume", value: totalVolume, prefix: "$" },
              { label: "Active Markets", value: activeMarkets },
              { label: "Positions Sealed", value: sealedPositions },
            ]}
          />
        </div>
      </section>

      {/* Tick-mark divider: Stats → Featured */}
      <div className="section-divider mx-4 md:mx-6 lg:mx-8" aria-hidden="true" />

      {/* Featured Markets */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between stagger-enter" style={{ animationDelay: "100ms" }}>
            <div>
              <h2 className="font-serif text-2xl text-text-primary md:text-3xl">
                Live Markets
              </h2>
              <p className="mt-1 font-mono text-xs text-text-muted">
                Positions sealed — odds computed on-chain
              </p>
            </div>
            <Link
              href="/markets"
              className="hidden font-mono text-xs text-text-muted transition-colors duration-150 hover:text-text-primary md:block"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* Lead market — largest by volume */}
            {leadMarket && (
              <MarketCard key={leadMarket.id} market={leadMarket} index={0} featured />
            )}
            {/* Remaining markets */}
            <div className="flex flex-col gap-4">
              {restMarkets.map((market, i) => (
                <MarketCard key={market.id} market={market} index={i + 1} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tick-mark divider: Featured → Activity */}
      <div className="section-divider mx-4 md:mx-6 lg:mx-8" aria-hidden="true" />

      {/* Recent Activity + Protocol Status */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 font-serif text-2xl text-text-primary md:text-3xl stagger-enter" style={{ animationDelay: "100ms" }}>
                Recent Activity
              </h2>
              <RecentActivity />
            </div>
            <div className="flex flex-col justify-center rounded-sm border border-border bg-surface-elevated/50 p-8 stagger-enter" style={{ animationDelay: "200ms" }}>
              <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-text-muted uppercase">
                Protocol Status
              </div>
              <div className="space-y-4">
                {[
                  { label: "Encryption", status: "Active" },
                  { label: "HE Computation", status: "Online" },
                  { label: "Settlement Oracle", status: "Awaiting" },
                  { label: "Network", status: "Avalanche C-Chain" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-text-muted">{item.label}</span>
                    <span className="font-mono text-xs text-text-secondary">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tick-mark divider: Activity → How It Works */}
      <div className="section-divider mx-4 md:mx-6 lg:mx-8" aria-hidden="true" />

      {/* How It Works */}
      <section className="relative bg-surface-raised">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <h2 className="mb-12 text-center font-serif text-2xl text-text-primary md:text-3xl stagger-enter" style={{ animationDelay: "100ms" }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Place an encrypted bet", desc: "Your position is sealed using eERC encryption. Bet size and direction are hidden from everyone — including the protocol." },
              { step: "02", title: "Odds update live", desc: "Homomorphic encryption lets the protocol compute aggregate odds without decrypting individual positions." },
              { step: "03", title: "Settlement reveals all", desc: "When the market resolves, positions decrypt simultaneously. Winners claim rewards. Nothing was faked." },
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col items-center text-center stagger-enter" style={{ animationDelay: `${200 + i * 100}ms` }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-surface-elevated font-mono text-sm font-bold text-text-primary">
                  {item.step}
                </div>
                <h3 className="mb-2 font-serif text-lg text-text-primary">{item.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
