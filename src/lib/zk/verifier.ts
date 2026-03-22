/**
 * ZK Proof Verifier
 *
 * Verifies a Groth16 ZK proof that a vote quorum was reached.
 * Uses the verification key generated during trusted setup.
 */

import * as snarkjs from 'snarkjs';
import { readFileSync } from 'fs';
import { CIRCUIT_PATHS } from './setup';
import type { Groth16Proof, PublicSignals, ZkVerifyResult } from './types';

// Cache the verification key in memory (loaded once)
let verificationKeyCache: Record<string, unknown> | null = null;

function getVerificationKey(): Record<string, unknown> {
  if (!verificationKeyCache) {
    verificationKeyCache = JSON.parse(
      readFileSync(CIRCUIT_PATHS.verificationKey, 'utf-8')
    );
  }
  return verificationKeyCache!;
}

/**
 * Verify a ZK vote proof.
 *
 * @param proof - Groth16 proof from the prover
 * @param publicSignals - public signals [yesVotes, quorumMet, quorum, voterCount]
 * @returns ZkVerifyResult with validity and decoded values
 */
export async function verifyVoteProof(
  proof: Groth16Proof,
  publicSignals: PublicSignals
): Promise<ZkVerifyResult> {
  const vkey = getVerificationKey();

  const valid = await snarkjs.groth16.verify(
    vkey,
    publicSignals as unknown as string[],
    proof as unknown as Record<string, unknown>
  );

  return {
    valid,
    yesVotes: parseInt(publicSignals[0], 10),
    quorumMet: publicSignals[1] === '1',
    quorum: parseInt(publicSignals[2], 10),
    voterCount: parseInt(publicSignals[3], 10),
  };
}
