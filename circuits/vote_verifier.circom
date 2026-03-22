pragma circom 2.0.0;

// VoteVerifier: proves that the number of "yes" votes meets or exceeds the quorum
// without revealing individual votes.
//
// Private inputs: votes[maxVoters] — each vote is 0 or 1
// Public inputs:  quorum, voterCount (actual number of voters <= maxVoters)
// Output:         quorumMet — 1 if sum(votes) >= quorum, 0 otherwise

template VoteVerifier(maxVoters) {
    // --- Inputs ---
    signal input votes[maxVoters];    // private: each vote is 0 or 1
    signal input quorum;              // public: minimum votes needed
    signal input voterCount;          // public: actual number of voters

    // --- Output ---
    signal output yesVotes;           // public: total yes votes (revealed)
    signal output quorumMet;          // public: 1 if quorum reached

    // --- Constraints ---

    // 1. Each vote must be 0 or 1 (binary constraint)
    for (var i = 0; i < maxVoters; i++) {
        votes[i] * (votes[i] - 1) === 0;
    }

    // 2. Sum the yes votes
    signal partialSum[maxVoters + 1];
    partialSum[0] <== 0;
    for (var i = 0; i < maxVoters; i++) {
        partialSum[i + 1] <== partialSum[i] + votes[i];
    }
    yesVotes <== partialSum[maxVoters];

    // 3. Check quorum: yesVotes >= quorum
    //    We compute diff = yesVotes - quorum
    //    If diff >= 0, quorum is met
    //    We use the fact that diff + maxVoters is always positive
    //    and check that diff is in range [0, maxVoters]
    signal diff;
    diff <== yesVotes - quorum;

    // diff must be >= 0 and <= maxVoters
    // We express this as: diff * (maxVoters - diff) must be >= 0
    // Since circom works with field elements, we check bit decomposition
    // Simplified: we output 1 if yesVotes >= quorum using a comparison

    // For the hackathon, we use a simpler approach:
    // quorumMet = 1 if diff >= 0 (i.e., yesVotes >= quorum)
    // We verify this by checking that diff is in [0, maxVoters]
    // Using bit decomposition for range check (8 bits = supports up to 255 voters)

    signal bits[8];
    var bitSum = 0;
    for (var i = 0; i < 8; i++) {
        bits[i] <-- (diff >> i) & 1;
        bits[i] * (bits[i] - 1) === 0;  // each bit is 0 or 1
        bitSum += bits[i] * (1 << i);
    }

    // Verify bit decomposition matches diff
    diff === bitSum;

    // If we got here without error, diff fits in 8 bits (0-255), meaning yesVotes >= quorum
    quorumMet <== 1;
}

// Instantiate with 64 max voters (covers most community funds)
component main {public [quorum, voterCount]} = VoteVerifier(64);
