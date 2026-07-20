"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";

const sections = [
  {
    id: "architecture",
    title: "Architecture Overview",
    content: `VEIL operates on Avalanche C-Chain using a three-layer architecture:

1. Client Layer — Browser-based encryption using WebCrypto API. Users generate ElGamal key pairs; all position data is encrypted client-side before submission.

2. Protocol Layer — Smart contracts store ciphertext and compute aggregate odds via homomorphic addition. The contract never sees plaintext positions.

3. Settlement Layer — Threshold decryption using a network of decryptors. No single party can decrypt positions alone; a quorum is required.`,
  },
  {
    id: "eerc",
    title: "eERC Integration",
    content: `VEIL uses eERC (encrypted ERC) tokens to represent encrypted positions. Each bet is minted as an eERC token whose value is hidden on-chain.

Key properties:
- Ciphertext is semantically secure (indistinguishable from random noise)
- Positions can be transferred without revealing their value
- The protocol can compute on ciphertext (addition, comparison) without decryption
- Settlement requires threshold decryption from a quorum of decryptors`,
  },
  {
    id: "threshold",
    title: "Threshold Decryption Flow",
    content: `When a market resolves:

1. The settlement oracle submits the outcome to the smart contract
2. The contract requests decryption from the decryptor network
3. Each decryptor produces a partial decryption share
4. When enough shares are collected (t-of-n threshold), the full plaintext is reconstructed
5. Positions are decrypted, P&L is calculated, and winners can claim

No single decryptor can access individual positions. The threshold ensures that even if some decryptors are compromised, positions remain secure.`,
  },
  {
    id: "institutional",
    title: "Institutional Tier",
    content: `For institutional participants, VEIL offers a permissioned L1 with:

- KYC-gated access via institutional identity providers
- Higher position limits and faster settlement
- Custom encryption parameters for portfolio-level privacy
- Dedicated decryptor network with SLA guarantees
- Regulatory compliance tools and audit trails

Institutional tier operates on a separate Avalanche subnet with its own validator set, ensuring isolation from retail traffic.`,
  },
  {
    id: "contracts",
    title: "Contract Addresses (Fuji Testnet)",
    content: `Market Registry:    0x7a3F...e2b1
Position Vault:     0x4b2C...a8d3
Settlement Oracle:  0x9f1E...c4f7
Decryptor Network:  0x2d8A...b6e9

All contracts are deployed on Avalanche Fuji testnet. Mainnet deployment pending audit completion.`,
  },
  {
    id: "faq",
    title: "FAQ",
    content: `Q: Can the protocol see my bet?
A: No. Your position is encrypted client-side using your private key. The smart contract only stores ciphertext.

Q: Can other users see my bet?
A: No. All positions are encrypted on-chain. Only aggregate odds are visible (via homomorphic computation).

Q: How does settlement work if everything is encrypted?
A: Threshold decryption. A network of decryptors collectively decrypt positions at settlement — no single party can do it alone.

Q: What if a decryptor is compromised?
A: The threshold scheme requires t-of-n shares. Compromising fewer than t decryptors reveals nothing.

Q: Is this on mainnet?
A: Currently on Fuji testnet. Mainnet after audit.`,
  },
];

export default function DocsPage() {
  return (
    <div className="relative bg-paper paper-texture">
      {/* Case file margin line */}
      <div className="case-file-margin case-file-margin--light absolute left-[calc(50%-20rem)] top-0 bottom-0 hidden lg:block" aria-hidden="true" />

      <main id="main-content" className="mx-auto max-w-4xl px-4 pt-16 pb-20 md:px-6 md:pt-24 lg:px-8">
        {/* Header */}
        <div className="mb-12 border-b border-veil-200 pb-8 stagger-enter" style={{ animationDelay: "0ms" }}>
          <div className="flex items-start justify-between">
            <div>
              <span className="mb-3 inline-block font-mono text-[10px] tracking-[0.3em] text-veil-400 uppercase">
                Documentation
              </span>
              <h1 className="font-serif text-3xl text-ink md:text-4xl">
                Technical Reference
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-veil-500">
                Architecture, encryption protocols, contract addresses, and
                integration guides for the VEIL confidential prediction market.
              </p>
            </div>
            <span className="hidden font-mono text-[10px] tracking-[0.15em] text-veil-400/40 md:block">
              Ref: VEIL-2026-DOC
            </span>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="mb-12 stagger-enter" style={{ animationDelay: "50ms" }}>
          <h2 className="mb-3 font-mono text-[10px] tracking-[0.2em] text-veil-400 uppercase">
            Contents
          </h2>
          <ul className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="font-mono text-xs text-veil-500 transition-colors duration-150 hover:text-ink"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20 stagger-enter"
              style={{ animationDelay: `${100 + i * 60}ms` }}
            >
              <h2 className="mb-4 font-serif text-xl text-ink">
                {section.title}
              </h2>
              <div className="prose-veil whitespace-pre-line rounded-sm border border-veil-200 bg-veil-50 p-6 font-mono text-xs leading-relaxed text-veil-600">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer link */}
        <div className="mt-12 border-t border-veil-200 pt-8">
          <Link
            href="/how-it-works"
            className="font-mono text-xs text-veil-500 transition-colors duration-150 hover:text-ink"
          >
            ← Back to How It Works
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
