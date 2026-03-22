/**
 * ZK Proof types for vote verification
 */

// Groth16 proof structure from snarkjs
export interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: 'groth16';
  curve: 'bn128';
}

// Public signals output from the circuit
// [yesVotes, quorumMet, quorum, voterCount]
export type PublicSignals = [string, string, string, string];

// Full ZK proof result
export interface ZkVoteProof {
  proof: Groth16Proof;
  publicSignals: PublicSignals;
  yesVotes: number;
  quorumMet: boolean;
  quorum: number;
  voterCount: number;
  proofHash: string; // SHA-256 hash of the proof (published on-chain in Memo)
  generatedAt: string; // ISO timestamp
}

// Input to generate a proof
export interface ZkProveInput {
  votes: number[]; // array of 0s and 1s (actual votes from DB)
  quorum: number;
  voterCount: number;
}

// Verification result
export interface ZkVerifyResult {
  valid: boolean;
  yesVotes: number;
  quorumMet: boolean;
  quorum: number;
  voterCount: number;
}
