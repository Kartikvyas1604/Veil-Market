export type MarketStatus = "live" | "resolved";

export interface Market {
  id: string;
  question: string;
  category: string;
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  yesPool: number;
  noPool: number;
  status: MarketStatus;
  endDate: number;
  resolvedOutcome?: "yes" | "no";
  resolutionDate?: number;
}

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

export const markets: Market[] = [
  {
    id: "fed-rate-jan-2026",
    question: "Will the Federal Reserve cut rates in January 2026?",
    category: "Macro",
    yesOdds: 0.62,
    noOdds: 0.38,
    totalPool: 284750,
    yesPool: 176545,
    noPool: 108205,
    status: "live",
    endDate: now + 12 * DAY + 6 * HOUR,
  },
  {
    id: "btc-150k-q1",
    question: "Will Bitcoin exceed $150,000 before end of Q1 2026?",
    category: "Crypto",
    yesOdds: 0.41,
    noOdds: 0.59,
    totalPool: 1243890,
    yesPool: 509995,
    noPool: 733895,
    status: "live",
    endDate: now + 45 * DAY,
  },
  {
    id: "spacex-starship-orbit",
    question: "Will SpaceX Starship complete a full orbital mission by March 2026?",
    category: "Science",
    yesOdds: 0.73,
    noOdds: 0.27,
    totalPool: 892340,
    yesPool: 651408,
    noPool: 240932,
    status: "live",
    endDate: now + 28 * DAY + 14 * HOUR,
  },
  {
    id: "us-gov-shutdown",
    question: "Will the US federal government experience a shutdown in 2026?",
    category: "Politics",
    yesOdds: 0.34,
    noOdds: 0.66,
    totalPool: 567200,
    yesPool: 192848,
    noPool: 374352,
    status: "live",
    endDate: now + 89 * DAY,
  },
  {
    id: "ai-nobel-prize",
    question: "Will an AI-related research team win a Nobel Prize in 2026?",
    category: "Science",
    yesOdds: 0.28,
    noOdds: 0.72,
    totalPool: 345600,
    yesPool: 96768,
    noPool: 248832,
    status: "live",
    endDate: now + 180 * DAY,
  },
  {
    id: "avax-50-q2",
    question: "Will AVAX token price exceed $50 by end of Q2 2026?",
    category: "Crypto",
    yesOdds: 0.55,
    noOdds: 0.45,
    totalPool: 423100,
    yesPool: 232705,
    noPool: 190395,
    status: "live",
    endDate: now + 62 * DAY + 8 * HOUR,
  },
  {
    id: "apple-ar-launch",
    question: "Will Apple announce a new AR headset by WWDC 2026?",
    category: "Tech",
    yesOdds: 0.81,
    noOdds: 0.19,
    totalPool: 678900,
    yesPool: 549909,
    noPool: 128991,
    status: "live",
    endDate: now + 35 * DAY + 20 * HOUR,
  },
  {
    id: "sol-etf-approved",
    question: "Will a Solana spot ETF be approved by the SEC in 2026?",
    category: "Crypto",
    yesOdds: 0.47,
    noOdds: 0.53,
    totalPool: 912400,
    yesPool: 428828,
    noPool: 483572,
    status: "live",
    endDate: now + 150 * DAY,
  },
  {
    id: "el-salvador-btc-reserve",
    question: "Will El Salvador increase its Bitcoin reserve by 50% in 2026?",
    category: "Macro",
    yesOdds: 0.22,
    noOdds: 0.78,
    totalPool: 156800,
    yesPool: 34496,
    noPool: 122304,
    status: "resolved",
    endDate: now - 5 * DAY,
    resolvedOutcome: "no",
    resolutionDate: now - 5 * DAY,
  },
];

export function getMarket(id: string): Market | undefined {
  return markets.find((m) => m.id === id);
}

export function getLiveMarkets(): Market[] {
  return markets.filter((m) => m.status === "live");
}

export function getResolvedMarkets(): Market[] {
  return markets.filter((m) => m.status === "resolved");
}
