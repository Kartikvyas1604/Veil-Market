# VEIL

**Confidential Prediction Markets on Avalanche**

Encrypted positions on real-world outcomes. Nobody sees your bet until settlement.

VEIL uses ElGamal homomorphic encryption (eERC protocol) to keep bet amounts and directions fully encrypted on-chain. The smart contract computes aggregate odds via homomorphic addition — without ever decrypting individual positions. A threshold decryption committee reveals only pool totals at resolution.

## Features

- **Encrypted Positions** — All bets are encrypted client-side using ElGamal on the BabyJubJub curve. Individual positions remain hidden on-chain.
- **Homomorphic Odds** — The contract adds encrypted bets together without decrypting them, enabling live odds computation on ciphertext.
- **Threshold Decryption** — A 2/3 supermajority committee reveals only aggregate pool totals. Individual bets stay sealed.
- **Zero-Knowledge Proofs** — Bet validity verified via Groth16 proofs to prevent invalid state transitions.
- **Real-Time Odds** — Live odds updates pushed to the frontend without page refreshes via Supabase Realtime.
- **Market Creation** — Create yes/no prediction markets across Crypto, Politics, Science, Tech, Macro, and Sports categories.
- **Portfolio Dashboard** — Track your encrypted positions with sealed/revealed status.
- **SIWE Authentication** — Wallet-based auth with session cookies. No passwords.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Three.js |
| Web3 | wagmi, viem, WalletConnect, SIWE |
| Smart Contracts | Solidity 0.8.27, Foundry, OpenZeppelin, eERC (EncryptedERC) |
| Backend | Supabase (PostgreSQL, Edge Functions, Realtime) |
| Encryption | ElGamal homomorphic encryption, BabyJubJub curve, Groth16 ZK proofs |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Foundry (optional, for smart contract development)
- Supabase project
- WalletConnect project ID

### Installation

```bash
git clone <repo-url>
cd avalanch-speedrun
npm install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Fill in the required variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Yes | WalletConnect project ID |
| `NEXT_PUBLIC_VEIL_FACTORY_ADDRESS` | Yes | Deployed VeilFactory contract address |
| `NEXT_PUBLIC_REGISTRAR_ADDRESS` | Yes | Deployed VeilRegistry contract address |
| `NEXT_PUBLIC_THRESHOLD_DECRYPTION_ADDRESS` | Yes | Deployed ThresholdDecryption contract address |
| `COMMITTEE_ADDRESSES` | Yes | Comma-separated committee wallet addresses |
| `NEXT_PUBLIC_AVALANCHE_RPC` | No | Avalanche RPC (default: Fuji testnet) |
| `NEXT_PUBLIC_DOMAIN` | No | SIWE domain (default: `localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | No | Application URL |
| `NEXT_PUBLIC_EERC_WASM_PATH` | No | eERC circuit WASM file path |
| `NEXT_PUBLIC_EERC_ZKEY_PATH` | No | eERC circuit ZKey file path |

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm start
```

## Smart Contracts

Contracts are built and deployed using Foundry.

### Deploy to Avalanche Fuji Testnet

```bash
export PRIVATE_KEY=0x...
cd contracts
forge script script/DeployVeil.s.sol \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
  --broadcast \
  --verify \
  -vvvv
```

### Contract Architecture

| Contract | Purpose |
|----------|---------|
| `VeilMarket.sol` | Individual prediction market — encrypted pool accumulators, bet placement, settlement |
| `VeilFactory.sol` | Factory for deploying new markets |
| `VeilRegistry.sol` | Maps wallet addresses to BabyJubJub public keys |
| `ThresholdDecryption.sol` | On-chain verification of threshold-decrypted pool totals |
| `PassthroughBetVerifier.sol` | Testnet stub (production uses Groth16 verifier) |

## Database

Apply Supabase migrations in order:

```bash
# 1. Schema
supabase db push  # or apply supabase/migrations/001_initial_schema.sql

# 2. Seed data
node scripts/seed-markets.js
```

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/markets` | GET | List all markets |
| `/api/markets/[id]` | GET | Get market details |
| `/api/markets/[id]/odds` | GET | Get market odds |
| `/api/markets/create` | POST | Create a new market |
| `/api/markets/sync` | POST | Sync on-chain data to Supabase |
| `/api/auth/nonce` | GET | Generate SIWE nonce |
| `/api/auth/verify` | POST | Verify SIWE signature |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/signout` | POST | Sign out |

## How It Works

1. **Encrypt** — A bettor encrypts their position (yes/no, amount) client-side using ElGamal encryption.
2. **Submit** — The ciphertext is submitted on-chain. A Groth16 proof validates the bet without revealing it.
3. **Accumulate** — The contract homomorphically adds the encrypted bet to the pool accumulator. Odds update without decryption.
4. **Decrypt** — At resolution, a 2/3 threshold committee collectively decrypts only the aggregate pool totals.
5. **Settle** — Winners claim rewards. Individual bets remain private.

## License

(c) 2026 Veil Protocol. All positions encrypted.
