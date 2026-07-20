/**
 * BabyJubJub curve point
 */
export interface Point {
  x: bigint;
  y: bigint;
}

/**
 * ElGamal ciphertext (two curve points)
 */
export interface EGCT {
  c1: Point;
  c2: Point;
}

/**
 * Bet proof for placing a bet
 */
export interface BetProof {
  proofA: [bigint, bigint];
  proofB: [[bigint, bigint], [bigint, bigint]];
  proofC: [bigint, bigint];
  publicSignals: [bigint, bigint, bigint, bigint, bigint];
  encryptedBet: EGCT;
  nullifier: string;
}

/**
 * Market status from on-chain
 */
export enum MarketStatus {
  Active = 0,
  ResolutionPending = 1,
  Resolved = 2,
  Disputed = 3,
}

/**
 * Market outcome from on-chain
 */
export enum Outcome {
  None = 0,
  Yes = 1,
  No = 2,
}

/**
 * Market data from Supabase
 */
export interface Market {
  marketId: number;
  contractAddress: string;
  question: string;
  category: string;
  resolutionTime: string;
  status: MarketStatus;
  outcome: Outcome;
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  totalBets: number;
}

/**
 * Odds data from Supabase
 */
export interface OddsData {
  yesOdds: number;
  noOdds: number;
  yesTotal: number;
  noTotal: number;
  totalBets: number;
  publishedAt: string;
}

/**
 * Position commitment (no amounts stored)
 */
export interface PositionCommitment {
  id: string;
  userId: string;
  marketId: number;
  commitmentHash: string;
  nullifier: string;
  side: 1 | 2;
  blockNumber: number;
  transactionHash: string;
  createdAt: string;
}
