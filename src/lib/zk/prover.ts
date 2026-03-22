/**
 * ZK Proof Generator
 *
 * Generates a Groth16 ZK proof that a vote quorum was reached,
 * without revealing individual votes.
 */

import * as snarkjs from 'snarkjs';
import { createHash } from 'crypto';
import { CIRCUIT_PATHS, MAX_VOTERS } from './setup';
import type { ZkVoteProof, ZkProveInput, Groth16Proof, PublicSignals } from './types';

/**
 * Generate a ZK proof for a set of votes.
 *
 * @param input - votes (0/1 array), quorum, voterCount
 * @returns ZkVoteProof with proof, public signals, and proof hash
 * @throws if quorum is not met (circuit will reject)
 */
export async function generateVoteProof(input: ZkProveInput): Promise<ZkVoteProof> {
  const { votes, quorum, voterCount } = input;

  if (voterCount > MAX_VOTERS) {
    throw new Error(`Voter count ${voterCount} exceeds max ${MAX_VOTERS}`);
  }

  if (votes.length > MAX_VOTERS) {
    throw new Error(`Votes array length ${votes.length} exceeds max ${MAX_VOTERS}`);
  }

  // Pad votes array to MAX_VOTERS (circuit expects fixed-size input)
  const paddedVotes = new Array(MAX_VOTERS).fill(0);
  for (let i = 0; i < votes.length; i++) {
    paddedVotes[i] = votes[i];
  }

  const circuitInput = {
    votes: paddedVotes,
    quorum,
    voterCount,
  };

  // Generate proof (throws if quorum not met — circuit constraint fails)
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    CIRCUIT_PATHS.wasm,
    CIRCUIT_PATHS.zkey
  );

  const typedProof = proof as unknown as Groth16Proof;
  const typedSignals = publicSignals as unknown as PublicSignals;

  // Parse public signals: [yesVotes, quorumMet, quorum, voterCount]
  const yesVotes = parseInt(typedSignals[0], 10);
  const quorumMet = typedSignals[1] === '1';

  // Hash the proof for on-chain publication (Memo field)
  const proofHash = createHash('sha256')
    .update(JSON.stringify(proof))
    .digest('hex');

  return {
    proof: typedProof,
    publicSignals: typedSignals,
    yesVotes,
    quorumMet,
    quorum,
    voterCount,
    proofHash,
    generatedAt: new Date().toISOString(),
  };
}
