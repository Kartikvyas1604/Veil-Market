"use client";

import Link from "next/link";
import { CipherNoise } from "@/components/cipher-noise";
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
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Cipher noise background */}
        <div className="absolute inset-0">
          <CipherNoise
            className="absolute inset-0 h-full w-full"
            density={0.35}
            speed={100}
            opacity={0.05}
          />
          <GridBg className="absolute inset-0 h-full w-full" />
          {/* Radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(224,247,250,0.04),transparent)]" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-veil-bg to-transparent" />
          {/* Scanline */}
          <Scanline />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-20 md:px-6 md:pt-32 md:pb-24 lg:px-8">
          {/* Classified tag */}
          <div
            className="mb-8 flex justify-center stagger-enter"
            style={{ animationDelay: "0ms" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-veil-border bg-veil-surface/50 px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
              <span className="h-1 w-1 rounded-full bg-veil-accent" />
              Confidential Prediction Markets
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-6 text-center font-serif text-4xl leading-[1.1] text-veil-text-bright md:text-5xl lg:text-6xl stagger-enter"
            style={{ animationDelay: "100ms" }}
          >
            Your bets, sealed
            <br />
            <span className="italic text-veil-accent">until settlement</span>
          </h1>

          {/* Subhead */}
          <p
            className="mx-auto mb-10 max-w-xl text-center text-base text-veil-text-dim md:text-lg stagger-enter"
            style={{ animationDelay: "200ms" }}
          >
            Bet on real-world outcomes with encrypted positions. Nobody sees your
            bet size or direction — but the protocol computes live aggregate odds
            via homomorphic encryption.
          </p>

          {/* CTA */}
          <div
            className="flex justify-center gap-4 stagger-enter"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/markets"
              className="inline-flex h-11 items-center rounded-md bg-veil-accent px-6 font-mono text-xs font-semibold tracking-wide text-veil-bg transition-all duration-150 hover:bg-veil-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg"
            >
              Browse Markets
            </Link>
            <button
              type="button"
              className="inline-flex h-11 items-center rounded-md border border-veil-border px-6 font-mono text-xs font-medium tracking-wide text-veil-text-dim transition-colors duration-150 hover:border-veil-border-strong hover:text-veil-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-veil-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-veil-bg"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative border-y border-veil-border bg-veil-surface/30">
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
          <div
            className="mb-8 flex items-end justify-between stagger-enter"
            style={{ animationDelay: "100ms" }}
          >
            <div>
              <h2 className="font-serif text-2xl text-veil-text-bright md:text-3xl">
                Live Markets
              </h2>
              <p className="mt-1 font-mono text-xs text-veil-text-muted">
                Positions encrypted — odds computed on-chain
              </p>
            </div>
            <Link
              href="/markets"
              className="hidden font-mono text-xs text-veil-accent/70 transition-colors duration-150 hover:text-veil-accent md:block"
            >
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featuredMarkets.map((market, i) => (
              <MarketCard key={market.id} market={market} index={i} />
            ))}
          </div>

          <div className="mt-6 text-center md:hidden">
            <Link
              href="/markets"
              className="font-mono text-xs text-veil-accent/70 transition-colors duration-150 hover:text-veil-accent"
            >
              View all markets →
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="relative border-t border-veil-border">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2
                className="mb-6 font-serif text-2xl text-veil-text-bright md:text-3xl stagger-enter"
                style={{ animationDelay: "100ms" }}
              >
                Recent Activity
              </h2>
              <RecentActivity />
            </div>
            <div
              className="flex flex-col justify-center rounded-lg border border-veil-border bg-veil-surface/30 p-8 stagger-enter"
              style={{ animationDelay: "200ms" }}
            >
              <div className="mb-4 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
                Protocol Status
              </div>
              <div className="space-y-4">
                {[
                  { label: "Encryption", status: "Active", color: "text-veil-success" },
                  { label: "HE Computation", status: "Online", color: "text-veil-success" },
                  { label: "Settlement Oracle", status: "Awaiting", color: "text-veil-accent" },
                  { label: "Network", status: "Avalanche C-Chain", color: "text-veil-text-dim" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-veil-text-muted">{item.label}</span>
                    <span className={`font-mono text-xs ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-veil-border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-veil-success animate-pulse" />
                  <span className="font-mono text-[10px] text-veil-text-muted">
                    All systems operational
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative border-t border-veil-border">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <h2
            className="mb-12 text-center font-serif text-2xl text-veil-text-bright md:text-3xl stagger-enter"
            style={{ animationDelay: "100ms" }}
          >
            How It Works
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Place an encrypted bet",
                desc: "Your position is sealed using eERC encryption. Bet size and direction are hidden from everyone — including the protocol.",
              },
              {
                step: "02",
                title: "Odds update live",
                desc: "Homomorphic encryption lets the protocol compute aggregate odds without decrypting individual positions. The market breathes.",
              },
              {
                step: "03",
                title: "Settlement reveals all",
                desc: "When the market resolves, positions decrypt simultaneously. Winners claim rewards. Every bet is verified, nothing was faked.",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="flex flex-col items-center text-center stagger-enter"
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-veil-border-strong bg-veil-surface font-mono text-sm font-bold text-veil-accent">
                  {item.step}
                </div>
                <h3 className="mb-2 font-serif text-lg text-veil-text-bright">
                  {item.title}
                </h3>
                <p className="max-w-xs text-sm leading-relaxed text-veil-text-dim">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
