"use client";

import Link from "next/link";
import { GridBg } from "@/components/grid-bg";
import { Scanline } from "@/components/scanline";
import { StatsBar } from "@/components/stats-bar";
import { MarketCard } from "@/components/market-card";
import { RecentActivity } from "@/components/recent-activity";
import { Footer } from "@/components/footer";
import { getLiveMarkets, markets } from "@/lib/markets";

const featuredMarkets = getLiveMarkets().slice(0, 4);
const totalVolume = markets.reduce((sum, m) => sum + m.totalPool, 0);
const activeMarkets = getLiveMarkets().length;
const sealedPositions = 12847;

export default function Home() {
  return (
    <div className="relative bg-paper">
      <GridBg className="fixed inset-0 h-full w-full opacity-30" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Scanline />
        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-32 md:pb-24 lg:px-8">
          {/* Case file tag */}
          <div className="mb-8 flex justify-center stagger-enter" style={{ animationDelay: "0ms" }}>
            <span className="inline-flex items-center gap-2 rounded-sm border border-veil-300 bg-veil-200/50 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-veil-500 uppercase">
              Case No. 2026-AVAX — Encrypted
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 text-center font-serif text-4xl leading-[1.05] text-ink md:text-5xl lg:text-[3.5rem] stagger-enter"
            style={{ animationDelay: "100ms" }}
          >
            Your positions,
            <br />
            <span className="italic">withheld until settlement</span>
          </h1>

          {/* Subhead */}
          <p
            className="mx-auto mb-10 max-w-xl text-center text-base text-veil-500 md:text-lg stagger-enter"
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
              className="stamp-btn inline-flex h-11 items-center rounded-sm border border-ink bg-ink px-6 font-mono text-xs font-semibold tracking-wide text-paper transition-colors duration-100 hover:bg-veil-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Enter App
            </Link>
            <Link
              href="/how-it-works"
              className="stamp-btn inline-flex h-11 items-center rounded-sm border border-veil-300 px-6 font-mono text-xs font-medium tracking-wide text-veil-600 transition-colors duration-100 hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-500 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              Read Documentation
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-veil-200 bg-veil-100/50">
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

      {/* Featured Markets */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between stagger-enter" style={{ animationDelay: "100ms" }}>
            <div>
              <h2 className="font-serif text-2xl text-ink md:text-3xl">
                Live Markets
              </h2>
              <p className="mt-1 font-mono text-xs text-veil-400">
                Positions sealed — odds computed on-chain
              </p>
            </div>
            <Link
              href="/markets"
              className="hidden font-mono text-xs text-veil-500 transition-colors duration-150 hover:text-ink md:block"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredMarkets.map((market, i) => (
              <MarketCard key={market.id} market={market} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity + Protocol Status */}
      <section className="relative border-t border-veil-200">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 font-serif text-2xl text-ink md:text-3xl stagger-enter" style={{ animationDelay: "100ms" }}>
                Recent Activity
              </h2>
              <RecentActivity />
            </div>
            <div className="flex flex-col justify-center rounded-sm border border-veil-200 bg-veil-100/50 p-8 stagger-enter" style={{ animationDelay: "200ms" }}>
              <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-veil-400 uppercase">
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
                    <span className="font-mono text-xs text-veil-400">{item.label}</span>
                    <span className="font-mono text-xs text-veil-600">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-veil-200 bg-veil-50">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <h2 className="mb-12 text-center font-serif text-2xl text-ink md:text-3xl stagger-enter" style={{ animationDelay: "100ms" }}>
            How It Works
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Place an encrypted bet", desc: "Your position is sealed using eERC encryption. Bet size and direction are hidden from everyone — including the protocol." },
              { step: "02", title: "Odds update live", desc: "Homomorphic encryption lets the protocol compute aggregate odds without decrypting individual positions." },
              { step: "03", title: "Settlement reveals all", desc: "When the market resolves, positions decrypt simultaneously. Winners claim rewards. Nothing was faked." },
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col items-center text-center stagger-enter" style={{ animationDelay: `${200 + i * 100}ms` }}>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-sm border border-veil-300 bg-veil-200 font-mono text-sm font-bold text-ink">
                  {item.step}
                </div>
                <h3 className="mb-2 font-serif text-lg text-ink">{item.title}</h3>
                <p className="max-w-xs text-sm leading-relaxed text-veil-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
