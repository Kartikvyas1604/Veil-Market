export function Footer() {
  return (
    <footer className="border-t border-border bg-surface-elevated">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-border-strong bg-surface-raised">
                <span className="font-mono text-xs font-bold text-text-primary">V</span>
              </div>
              <span className="font-mono text-sm font-semibold tracking-[0.2em] uppercase text-text-primary">
                Veil
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-text-muted">
              Confidential prediction markets on Avalanche. Encrypted positions,
              verified settlement.
            </p>
          </div>

          {[
            {
              title: "Protocol",
              links: ["How It Works", "Documentation", "Audits", "Bug Bounty"],
            },
            {
              title: "Resources",
              links: ["GitHub", "Whitepaper", "Smart Contracts", "SDK"],
            },
          ].map((section) => (
            <div key={section.title}>
              <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((item) => (
                  <li key={item}>
                    <span className="font-mono text-xs text-text-secondary transition-colors duration-150 hover:text-text-primary cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3 font-mono text-[10px] tracking-[0.2em] uppercase text-text-muted">
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
                  <span className="text-text-muted">{item.label}</span>
                  <span className="text-text-secondary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 md:flex-row">
          <span className="font-mono text-[10px] text-text-muted">
            &copy; 2026 Veil Protocol. All positions encrypted.
          </span>
          <span className="font-mono text-[10px] text-text-muted">
            Powered by eERC & Homomorphic Encryption
          </span>
        </div>
      </div>
    </footer>
  );
}
