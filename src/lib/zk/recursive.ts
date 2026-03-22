/**
 * Recursive ZK Proof — Scaffold
 *
 * STATUS: NOT ACTIVATED — structured for future implementation.
 *
 * This module provides the logic to split large vote sets into batches,
 * generate a VoteVerifier proof per batch, then aggregate them with
 * a RecursiveVoteVerifier proof.
 *
 * Architecture:
 *
 *   500 voters
 *     ├── Batch 1 (voters 1-64)   → ZK Proof₁
 *     ├── Batch 2 (voters 65-128) → ZK Proof₂
 *     ├── ...
 *     └── Batch 8 (voters 449-500)→ ZK Proof₈
 *                                      │
 *                    ┌─────────────────┘
 *                    ▼
 *           RecursiveVoteVerifier
 *           Inputs: publicSignals from all batch proofs
 *           Output: single proof that ALL batches are valid
 *                    │
 *                    ▼
 *           One compact proof published on-chain
 *
 * To activate:
 * 1. Compile recursive_verifier.circom (requires circom + trusted setup)
 * 2. Generate proving/verification keys for RecursiveVoteVerifier
 * 3. Uncomment the activation section in this file
 * 4. Wire into /api/zk/prove route as alternative path for large funds
 */

import { MAX_VOTERS } from './setup';
import type { ZkProveInput, ZkVoteProof } from './types';

// ─────────────────────────────────────────────────────────────
// Batch splitting logic
// ─────────────────────────────────────────────────────────────

export interface VoteBatch {
  batchIndex: number;
  votes: number[];
  voterCount: number;
}

/**
 * Split a large vote array into batches of MAX_VOTERS (64).
 * Each batch can be independently proven with VoteVerifier.
 */
export function splitIntoBatches(
  allVotes: number[],
  totalVoterCount: number
): VoteBatch[] {
  const batches: VoteBatch[] = [];
  const batchSize = MAX_VOTERS;

  for (let i = 0; i < allVotes.length; i += batchSize) {
    const batchVotes = allVotes.slice(i, i + batchSize);
    const batchVoterCount = Math.min(batchSize, totalVoterCount - i);

    batches.push({
      batchIndex: batches.length,
      votes: batchVotes,
      voterCount: batchVoterCount,
    });
  }

  return batches;
}

/**
 * Check if a vote set requires recursive proving (> MAX_VOTERS).
 */
export function requiresRecursiveProof(voterCount: number): boolean {
  return voterCount > MAX_VOTERS;
}

// ─────────────────────────────────────────────────────────────
// Recursive proof generation — SCAFFOLD (not activated)
// ─────────────────────────────────────────────────────────────

export interface RecursiveProofResult {
  batchProofs: ZkVoteProof[];
  recursiveProof: unknown; // Would be Groth16Proof when activated
  totalYesVotes: number;
  totalVoterCount: number;
  globalQuorumMet: boolean;
  proofHash: string;
}

/**
 * Generate a recursive proof from batch proofs.
 *
 * SCAFFOLD: This function outlines the recursive proof flow
 * but does not execute it. When the RecursiveVoteVerifier circuit
 * is compiled and keys are generated, this function will:
 *
 * 1. Take an array of batch ZkVoteProofs
 * 2. Extract their public signals (yesVotes, quorumMet, voterCount)
 * 3. Feed them into the RecursiveVoteVerifier circuit
 * 4. Generate a single recursive Groth16 proof
 * 5. Return the aggregated result with one compact proof hash
 *
 * @throws always — not yet implemented
 */
export async function generateRecursiveProof(
  _batchProofs: ZkVoteProof[],
  _totalQuorum: number
): Promise<RecursiveProofResult> {
  // ──────────────────────────────────────────────────
  // ACTIVATION CHECKLIST:
  //
  // 1. Compile: circom circuits/recursive_verifier.circom
  //    --r1cs --wasm --sym -o circuits/
  //
  // 2. Trusted setup:
  //    snarkjs groth16 setup circuits/recursive_verifier.r1cs
  //    circuits/pot12_final.ptau circuits/recursive_final.zkey
  //
  // 3. Export verification key:
  //    snarkjs zkey export verificationkey
  //    circuits/recursive_final.zkey circuits/recursive_vkey.json
  //
  // 4. Implement proof generation below:
  //
  // const batchSignals = _batchProofs.map(bp => ({
  //   batchYesVotes: bp.yesVotes,
  //   batchQuorumMet: bp.quorumMet ? 1 : 0,
  //   batchVoterCount: bp.voterCount,
  // }));
  //
  // const input = {
  //   batchYesVotes: pad(batchSignals.map(s => s.batchYesVotes), 16),
  //   batchQuorumMet: pad(batchSignals.map(s => s.batchQuorumMet), 16, 1),
  //   batchVoterCount: pad(batchSignals.map(s => s.batchVoterCount), 16),
  //   totalQuorum: _totalQuorum,
  //   activeBatches: _batchProofs.length,
  // };
  //
  // const { proof, publicSignals } = await snarkjs.groth16.fullProve(
  //   input,
  //   'circuits/recursive_verifier_js/recursive_verifier.wasm',
  //   'circuits/recursive_final.zkey'
  // );
  //
  // return {
  //   batchProofs: _batchProofs,
  //   recursiveProof: proof,
  //   totalYesVotes: parseInt(publicSignals[0]),
  //   totalVoterCount: parseInt(publicSignals[1]),
  //   globalQuorumMet: publicSignals[2] === '1',
  //   proofHash: sha256(JSON.stringify(proof)),
  // };
  // ──────────────────────────────────────────────────

  throw new Error(
    'Recursive ZK proofs are not yet activated. ' +
    'Compile recursive_verifier.circom and complete the trusted setup first. ' +
    'See activation checklist in src/lib/zk/recursive.ts'
  );
}

/**
 * Full recursive proof pipeline — SCAFFOLD
 *
 * When activated, this function will:
 * 1. Split votes into batches of 64
 * 2. Generate a VoteVerifier proof per batch (in parallel)
 * 3. Feed all batch proofs into RecursiveVoteVerifier
 * 4. Return one compact proof covering all voters
 *
 * Example: 500 voters → 8 batch proofs → 1 recursive proof
 */
export async function generateFullRecursiveProof(
  _input: ZkProveInput & { allVotes: number[] }
): Promise<RecursiveProofResult> {
  // const batches = splitIntoBatches(_input.allVotes, _input.voterCount);
  //
  // // Generate batch proofs in parallel
  // const batchProofs = await Promise.all(
  //   batches.map(batch =>
  //     generateVoteProof({
  //       votes: batch.votes,
  //       quorum: Math.ceil(_input.quorum / batches.length), // per-batch quorum
  //       voterCount: batch.voterCount,
  //     })
  //   )
  // );
  //
  // // Generate recursive proof
  // return generateRecursiveProof(batchProofs, _input.quorum);

  throw new Error(
    'Full recursive proof pipeline is not yet activated. ' +
    'See src/lib/zk/recursive.ts for activation instructions.'
  );
}
