import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-veil-border bg-veil-surface/20">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded border border-veil-border-strong bg-veil-surface">
                <span className="font-mono text-xs font-bold text-veil-accent">
                  V
                </span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-[0.2em] text-veil-text-bright uppercase">
                Veil
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-veil-text-muted">
              Confidential prediction markets on Avalanche. Your bets, encrypted
              by default. Settlement, verified on-chain.
            </p>
          </div>

          {/* Protocol */}
          <div>
            <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
              Protocol
            </h3>
            <ul className="space-y-2">
              {["How It Works", "Documentation", "Audits", "Bug Bounty"].map(
                (item) => (
                  <li key={item}>
                    <span className="font-mono text-xs text-veil-text-dim transition-colors duration-150 hover:text-veil-text cursor-pointer">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
              Resources
            </h3>
            <ul className="space-y-2">
              {["GitHub", "Whitepaper", "Smart Contracts", "Bug Bounty"].map(
                (item) => (
                  <li key={item}>
                    <span className="font-mono text-xs text-veil-text-dim transition-colors duration-150 hover:text-veil-text cursor-pointer">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Chain info */}
          <div>
            <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-veil-text-muted uppercase">
              Network
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Chain", value: "Avalanche C-Chain" },
                { label: "Encryption", value: "eERC (ElGamal)" },
                { label: "Verification", value: "ZK-SNARK" },
                { label: "Status", value: "Mainnet" },
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

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-veil-border pt-6 md:flex-row">
          <span className="font-mono text-[10px] text-veil-text-muted">
            © 2026 Veil Protocol. All positions encrypted.
          </span>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-veil-text-muted">
              Powered by eERC & Homomorphic Encryption
            </span>
            <div className="h-3 w-px bg-veil-border" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-veil-success" />
              <span className="font-mono text-[10px] text-veil-text-muted">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
