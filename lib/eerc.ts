"use client";

/**
 * eERC Client-Side Integration
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SECURITY INVARIANT — THE INVARIANT THAT MUST NEVER BE VIOLATED    │
 * │                                                                     │
 * │  Plaintext bet amounts or directions must NEVER exist on any       │
 * │  server, database, log, or code path outside of:                   │
 * │    1. The user's own browser during bet placement (their key)     │
 * │    2. The on-chain auditor-settlement flow after resolution        │
 * │                                                                     │
 * │  If a plaintext bet amount ever touches a server you control,      │
 * │  that is a CRITICAL BUG, not an edge case.                         │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * This module handles:
 * 1. Key derivation from wallet signature
 * 2. ElGamal encryption of bet amounts
 * 3. Groth16 proof generation for valid bets
 * 4. Construction of encrypted ciphertexts for on-chain submission
 *
 * All cryptographic operations happen in the browser.
 * The server never sees plaintext amounts.
 */

import { type WalletClient } from "viem";
import { type Point, type EGCT } from "./types";

// BabyJubJub curve parameters
const Q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const R = 2736030358979909402780800718157159386076813972158567259200215660948447373041n;
const BASE8: Point = {
  x: 5299619240641551281634865583518297030282874472190772894086521144482721001553n,
  y: 16950150798460657717958625567821834550301663161624707787222815936182638968203n,
};

// ─── BabyJubJub Arithmetic ────────────────────────────────────────

function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

function modInverse(a: bigint, m: bigint): bigint {
  // Extended Euclidean Algorithm
  let [old_r, r] = [a, m];
  let [old_s, s] = [1n, 0n];

  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }

  return mod(old_s, m);
}

function pointAdd(p1: Point, p2: Point): Point {
  const A = 168700n;
  const D = 168696n;

  const x1x2 = mod(p1.x * p2.x, Q);
  const y1y2 = mod(p1.y * p2.y, Q);
  const dx1x2y1y2 = mod(D * mod(x1x2 * y1y2, Q), Q);

  const x3Num = mod(p1.x * p2.y + p1.y * p2.x, Q);
  const y3Num = mod(y1y2 - A * x1x2, Q);

  return {
    x: mod(x3Num * modInverse(mod(1n + dx1x2y1y2, Q), Q), Q),
    y: mod(y3Num * modInverse(mod(1n - dx1x2y1y2, Q), Q), Q),
  };
}

function scalarMultiply(point: Point, scalar: bigint): Point {
  let remaining = mod(scalar, R);
  let result: Point = { x: 0n, y: 1n };
  let current = { ...point };

  while (remaining > 0n) {
    if (remaining & 1n) {
      result = pointAdd(result, current);
    }
    current = pointAdd(current, current);
    remaining >>= 1n;
  }

  return result;
}

// ─── Key Generation ──────────────────────────────────────────────

/**
 * Derive a BabyJubJub private key from a wallet signature
 * This is the same process used by the eERC SDK
 */
export async function deriveKeyFromSignature(
  walletClient: WalletClient,
  address: string
): Promise<{ privateKey: bigint; publicKey: Point }> {
  const message = `I'm signing this message to generate my encryption key for eERC protocol. Address: ${address}`;
  const signature = await walletClient.signMessage({ account: address as `0x${string}`, message });

  // Hash the signature to get the private key
  const encoder = new TextEncoder();
  const sigBytes = encoder.encode(signature);
  const hashBuffer = await crypto.subtle.digest("SHA-256", sigBytes);
  const hashArray = new Uint8Array(hashBuffer);
  const privateKey = BigInt(
    "0x" + Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("")
  ) % R;

  const publicKey = scalarMultiply(BASE8, privateKey);

  return { privateKey, publicKey };
}

// ─── ElGamal Encryption ──────────────────────────────────────────

/**
 * Encrypt a message (bet amount) under a public key
 * Returns an ElGamal ciphertext
 */
export function encryptMessage(
  publicKey: Point,
  message: bigint
): { cipher: EGCT; random: bigint } {
  const random = BigInt(
    "0x" + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  ) % R;

  const pMsg = scalarMultiply(BASE8, message);
  const c1 = scalarMultiply(BASE8, random);
  const pky = scalarMultiply(publicKey, random);
  const c2 = pointAdd(pMsg, pky);

  return { cipher: { c1, c2 }, random };
}

/**
 * Homomorphically add two ciphertexts
 * result = ct1 + ct2 (component-wise addition on BabyJubJub)
 */
export function homomorphicAdd(ct1: EGCT, ct2: EGCT): EGCT {
  return {
    c1: pointAdd(ct1.c1, ct2.c1),
    c2: pointAdd(ct1.c2, ct2.c2),
  };
}

/**
 * Create an identity ciphertext (encryption of 0)
 */
export function identityCiphertext(): EGCT {
  return {
    c1: { x: 0n, y: 1n },
    c2: { x: 0n, y: 1n },
  };
}

// ─── Bet Proof Generation ────────────────────────────────────────

export interface BetProof {
  proofA: [bigint, bigint];
  proofB: [[bigint, bigint], [bigint, bigint]];
  proofC: [bigint, bigint];
  publicSignals: [bigint, bigint, bigint, bigint, bigint];
  encryptedBet: EGCT;
  nullifier: string;
}

/**
 * Generate a bet proof for placing a bet
 *
 * In production, this would use snarkjs to generate a Groth16 proof
 * that proves:
 * 1. The encrypted value is a valid ElGamal ciphertext
 * 2. The amount is within [minBet, maxBet] range
 * 3. The user has sufficient balance
 *
 * For the hackathon, we generate a placeholder proof structure
 * that would be filled by the actual circuit in production.
 *
 * IMPORTANT: The bet amount is encrypted CLIENT-SIDE using the user's key.
 * The server never sees the plaintext amount.
 */
export async function generateBetProof(
  betAmount: bigint,
  marketId: number,
  side: 1 | 2,
  privateKey: bigint,
  publicKey: Point,
  auditorPublicKey: Point
): Promise<BetProof> {
  void auditorPublicKey;
  // 1. Generate random nullifier to prevent double-spending
  const nullifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const nullifier = "0x" + Array.from(nullifierBytes).map((b) => b.toString(16).padStart(2, "0")).join("");

  // 2. Encrypt the bet amount
  const { cipher: encryptedBet } = encryptMessage(publicKey, betAmount);

  // 3. Generate public signals
  // [bettor (placeholder), marketId, amountCommitment, poolCommitment, nullifier]
  const publicSignals: [bigint, bigint, bigint, bigint, bigint] = [
    0n, // bettor address (set by the contract)
    BigInt(marketId),
    encryptedBet.c2.x, // amount commitment (c2.x as commitment)
    encryptedBet.c2.y, // pool commitment (c2.y as commitment)
    BigInt(nullifier),
  ];

  // 4. Generate proof points
  // In production, this uses snarkjs.groth16.fullProve()
  // For now, we create placeholder proof points
  const proofA: [bigint, bigint] = [1n, 2n];
  const proofB: [[bigint, bigint], [bigint, bigint]] = [
    [3n, 4n],
    [5n, 6n],
  ];
  const proofC: [bigint, bigint] = [7n, 8n];

  return {
    proofA,
    proofB,
    proofC,
    publicSignals,
    encryptedBet,
    nullifier,
  };
}

// ─── Types ────────────────────────────────────────────────────────

export type { Point, EGCT };
