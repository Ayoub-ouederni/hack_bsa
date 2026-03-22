pragma circom 2.0.0;

// RecursiveVoteVerifier: verifies multiple batch ZK proofs and aggregates results.
//
// This circuit takes the public outputs of N batch proofs (from VoteVerifier)
// and proves that ALL batches met their respective quorums, producing a single
// aggregated result.
//
// Use case: when voter count exceeds single-circuit capacity (e.g. 1000+ members),
// votes are split into batches of 64, each batch gets a VoteVerifier proof,
// then this circuit proves all batch proofs are valid in one recursive step.
//
// STATUS: SCAFFOLD — not compiled or activated.
// Requires circom support for proof verification inside circuits (BN128 pairing
// checks via Groth16Verifier template from circomlib), which adds significant
// circuit complexity. Activate when needed.
//
// Architecture:
//
//   Batch 1 (votes 1-64)   → VoteVerifier proof₁ → publicSignals₁
//   Batch 2 (votes 65-128) → VoteVerifier proof₂ → publicSignals₂
//   Batch 3 (votes 129-192)→ VoteVerifier proof₃ → publicSignals₃
//   ...
//   Batch N                → VoteVerifier proofₙ → publicSignalsₙ
//
//           ┌──────────────────────────────────┐
//           │     RecursiveVoteVerifier         │
//           │                                  │
//           │  inputs:                         │
//           │    batchYesVotes[maxBatches]      │
//           │    batchQuorumMet[maxBatches]     │
//           │    batchVoterCount[maxBatches]    │
//           │    totalQuorum                    │
//           │    activeBatches                  │
//           │                                  │
//           │  outputs:                        │
//           │    totalYesVotes                  │
//           │    totalVoterCount                │
//           │    globalQuorumMet                │
//           └──────────────────────────────────┘
//
// In a full implementation, each batch's Groth16 proof would be verified
// inside this circuit using a Groth16Verifier sub-circuit. For the scaffold,
// we trust the batch public signals and only aggregate them.

template RecursiveVoteVerifier(maxBatches) {
    // --- Inputs ---
    // Public signals from each batch proof (output of VoteVerifier)
    signal input batchYesVotes[maxBatches];
    signal input batchQuorumMet[maxBatches];
    signal input batchVoterCount[maxBatches];

    // Global parameters
    signal input totalQuorum;        // public: global quorum across all batches
    signal input activeBatches;      // public: how many batches are actually used

    // --- Outputs ---
    signal output totalYesVotes;
    signal output totalVoterCount;
    signal output globalQuorumMet;

    // --- Constraints ---

    // 1. Each batchQuorumMet must be 0 or 1
    for (var i = 0; i < maxBatches; i++) {
        batchQuorumMet[i] * (batchQuorumMet[i] - 1) === 0;
    }

    // 2. Sum yes votes across all batches
    signal partialYesSum[maxBatches + 1];
    partialYesSum[0] <== 0;
    for (var i = 0; i < maxBatches; i++) {
        partialYesSum[i + 1] <== partialYesSum[i] + batchYesVotes[i];
    }
    totalYesVotes <== partialYesSum[maxBatches];

    // 3. Sum voter counts across all batches
    signal partialVoterSum[maxBatches + 1];
    partialVoterSum[0] <== 0;
    for (var i = 0; i < maxBatches; i++) {
        partialVoterSum[i + 1] <== partialVoterSum[i] + batchVoterCount[i];
    }
    totalVoterCount <== partialVoterSum[maxBatches];

    // 4. Verify all active batches met their quorum
    //    allBatchesMet = product of batchQuorumMet[0..activeBatches-1]
    //    If any batch failed (0), the product is 0
    signal partialProduct[maxBatches + 1];
    partialProduct[0] <== 1;
    for (var i = 0; i < maxBatches; i++) {
        // For inactive batches (i >= activeBatches), batchQuorumMet should be 1 (padding)
        partialProduct[i + 1] <== partialProduct[i] * batchQuorumMet[i];
    }

    // 5. Check global quorum: totalYesVotes >= totalQuorum
    signal diff;
    diff <== totalYesVotes - totalQuorum;

    // Range check: diff must fit in 16 bits (supports up to 65535 total voters)
    signal bits[16];
    var bitSum = 0;
    for (var i = 0; i < 16; i++) {
        bits[i] <-- (diff >> i) & 1;
        bits[i] * (bits[i] - 1) === 0;
        bitSum += bits[i] * (1 << i);
    }
    diff === bitSum;

    // 6. Global quorum met = all batches passed AND total votes >= total quorum
    globalQuorumMet <== partialProduct[maxBatches]; // 1 only if all batches met quorum
}

// Support up to 16 batches × 64 voters = 1024 voters max
// Increase maxBatches for larger scale
component main {public [totalQuorum, activeBatches]} = RecursiveVoteVerifier(16);
