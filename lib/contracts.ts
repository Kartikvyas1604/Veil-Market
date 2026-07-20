import { type Chain } from "viem";

// ─── Chain Configuration ─────────────────────────────────────────

export const avalanche: Chain = {
  id: 43114,
  name: "Avalanche C-Chain",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
    public: { http: ["https://api.avax.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Snowtrace", url: "https://snowtrace.io" },
  },
};

export const avalancheFuji: Chain = {
  id: 43113,
  name: "Avalanche Fuji",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
    public: { http: ["https://api.avax-test.network/ext/bc/C/rpc"] },
  },
  blockExplorers: {
    default: { name: "Snowtrace Fuji", url: "https://testnet.snowtrace.io" },
  },
};

// ─── Contract Addresses (Fuji Testnet) ───────────────────────────
// Replace with actual deployed addresses after deployment

export const CONTRACTS = {
  fuji: {
    veilFactory: "0x0000000000000000000000000000000000000000" as const,
    registrar: "0x0000000000000000000000000000000000000000" as const,
    thresholdDecryption: "0x0000000000000000000000000000000000000000" as const,
  },
  mainnet: {
    veilFactory: "0x0000000000000000000000000000000000000000" as const,
    registrar: "0x0000000000000000000000000000000000000000" as const,
    thresholdDecryption: "0x0000000000000000000000000000000000000000" as const,
  },
} as const;

// ─── Contract ABIs ───────────────────────────────────────────────

export const VEIL_FACTORY_ABI = [
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "question", type: "string" },
      { name: "category", type: "string" },
      { name: "resolutionTime", type: "uint256" },
      { name: "minBet", type: "uint256" },
      { name: "maxBet", type: "uint256" },
      { name: "committee", type: "address[]" },
    ],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getMarket",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "marketContract", type: "address", indexed: true },
      { name: "question", type: "string", indexed: false },
      { name: "resolutionTime", type: "uint256", indexed: false },
    ],
  },
] as const;

export const VEIL_MARKET_ABI = [
  {
    type: "function",
    name: "placeBet",
    inputs: [
      { name: "proofA", type: "uint256[2]" },
      { name: "proofB", type: "uint256[2][2]" },
      { name: "proofC", type: "uint256[2]" },
      { name: "publicSignals", type: "uint256[5]" },
      { name: "side", type: "uint8" },
      {
        name: "encryptedBet",
        type: "tuple",
        components: [
          { name: "c1", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
          { name: "c2", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPublishedOdds",
    inputs: [],
    outputs: [
      { name: "yesTotal", type: "uint256" },
      { name: "noTotal", type: "uint256" },
      { name: "totalBets", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPools",
    inputs: [],
    outputs: [
      {
        name: "yes",
        type: "tuple",
        components: [
          { name: "c1", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
          { name: "c2", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
        ],
      },
      {
        name: "no",
        type: "tuple",
        components: [
          { name: "c1", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
          { name: "c2", type: "tuple", components: [{ name: "x", type: "uint256" }, { name: "y", type: "uint256" }] },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "question",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "category",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "resolutionTime",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "status",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "outcome",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "betCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAcceptingBets",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "BetPlaced",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "bettor", type: "address", indexed: true },
      { name: "side", type: "uint8", indexed: false },
      { name: "nullifier", type: "bytes32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "PoolDecrypted",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "round", type: "uint256", indexed: false },
      { name: "yesTotal", type: "uint256", indexed: false },
      { name: "noTotal", type: "uint256", indexed: false },
      { name: "totalBets", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "MarketResolved",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true },
      { name: "outcome", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const REGISTRAR_ABI = [
  {
    type: "function",
    name: "isUserRegistered",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserPublicKey",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256[2]" }],
    stateMutability: "view",
  },
] as const;

// ─── Contract Addresses Helper ───────────────────────────────────

export function getContractAddresses(chainId: number) {
  switch (chainId) {
    case 43114:
      return CONTRACTS.mainnet;
    case 43113:
      return CONTRACTS.fuji;
    default:
      return CONTRACTS.fuji; // Default to Fuji
  }
}
