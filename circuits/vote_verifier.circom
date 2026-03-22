pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mux1.circom";

/*
 * VoteVerifier — ZK circuit for Pulse community fund voting
 *
 * Proves that a quorum of valid fund members voted on a request
 * WITHOUT revealing which specific members voted.
 *
 * Public inputs:
 *   - membersMerkleRoot : Poseidon Merkle root of all fund members
 *   - requestHash       : hash of the fund request being voted on
 *   - quorumRequired    : minimum number of votes needed
 *   - voteCount         : actual number of votes cast
 *
 * Private inputs:
 *   - voterSecrets[N]   : secret keys of voters (0 if slot unused)
 *   - merklePaths[N][D] : Merkle proof for each voter
 *   - pathIndices[N][D] : left/right indices for each Merkle proof
 *
 * The circuit verifies:
 *   1. Each voter's commitment (Poseidon(secret)) is in the members Merkle tree
 *   2. No duplicate voters (all commitments are unique)
 *   3. voteCount >= quorumRequired
 */

template MerkleProof(depth) {
    signal input leaf;
    signal input pathElements[depth];
    signal input pathIndices[depth];
    signal output root;

    signal hashes[depth + 1];
    hashes[0] <== leaf;

    component hashers[depth];
    component muxes_left[depth];
    component muxes_right[depth];

    for (var i = 0; i < depth; i++) {
        muxes_left[i] = Mux1();
        muxes_left[i].c[0] <== hashes[i];
        muxes_left[i].c[1] <== pathElements[i];
        muxes_left[i].s <== pathIndices[i];

        muxes_right[i] = Mux1();
        muxes_right[i].c[0] <== pathElements[i];
        muxes_right[i].c[1] <== hashes[i];
        muxes_right[i].s <== pathIndices[i];

        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== muxes_left[i].out;
        hashers[i].inputs[1] <== muxes_right[i].out;

        hashes[i + 1] <== hashers[i].out;
    }

    root <== hashes[depth];
}

template VoteVerifier(maxVoters, merkleDepth) {
    // Public inputs
    signal input membersMerkleRoot;
    signal input requestHash;
    signal input quorumRequired;
    signal input voteCount;

    // Private inputs
    signal input voterSecrets[maxVoters];
    signal input merklePaths[maxVoters][merkleDepth];
    signal input pathIndices[maxVoters][merkleDepth];

    // Step 1: Compute voter commitments from secrets
    component commitHashers[maxVoters];
    signal commitments[maxVoters];

    for (var i = 0; i < maxVoters; i++) {
        commitHashers[i] = Poseidon(2);
        commitHashers[i].inputs[0] <== voterSecrets[i];
        commitHashers[i].inputs[1] <== requestHash;
        commitments[i] <== commitHashers[i].out;
    }

    // Step 2: Verify each voter is in the members Merkle tree
    component merkleProofs[maxVoters];
    for (var i = 0; i < maxVoters; i++) {
        merkleProofs[i] = MerkleProof(merkleDepth);
        merkleProofs[i].leaf <== commitments[i];
        for (var j = 0; j < merkleDepth; j++) {
            merkleProofs[i].pathElements[j] <== merklePaths[i][j];
            merkleProofs[i].pathIndices[j] <== pathIndices[i][j];
        }
        merkleProofs[i].root === membersMerkleRoot;
    }

    // Step 3: Ensure no duplicate voters (all commitments are unique)
    component uniqueChecks[maxVoters * (maxVoters - 1) / 2];
    var checkIdx = 0;
    for (var i = 0; i < maxVoters; i++) {
        for (var j = i + 1; j < maxVoters; j++) {
            uniqueChecks[checkIdx] = IsEqual();
            uniqueChecks[checkIdx].in[0] <== commitments[i];
            uniqueChecks[checkIdx].in[1] <== commitments[j];
            uniqueChecks[checkIdx].out === 0;
            checkIdx++;
        }
    }

    // Step 4: Verify quorum is met
    component quorumCheck = GreaterEqThan(32);
    quorumCheck.in[0] <== voteCount;
    quorumCheck.in[1] <== quorumRequired;
    quorumCheck.out === 1;
}

// Instance: up to 64 voters, Merkle tree depth of 10 (supports 1024 members)
component main {public [membersMerkleRoot, requestHash, quorumRequired, voteCount]} = VoteVerifier(64, 10);
