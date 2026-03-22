/**
 * generate_proof.js — Generate a ZK proof for a vote
 *
 * Simulates a scenario where community members vote on a fund request
 * and a ZK proof is generated to attest the quorum was reached
 * without revealing individual voters.
 */

const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

const BUILD_DIR = path.resolve(__dirname, "..", "build");

// Simplified Poseidon-like hash for demo (in production, use circomlibjs)
function mockPoseidon(inputs) {
  // This is a placeholder — real implementation uses circomlibjs Poseidon
  let hash = BigInt(0);
  for (const input of inputs) {
    hash = (hash * BigInt(31) + BigInt(input)) % BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  }
  return hash;
}

// Build a simple Merkle tree
function buildMerkleTree(leaves, depth) {
  let currentLevel = [...leaves];

  // Pad to 2^depth
  const size = Math.pow(2, depth);
  while (currentLevel.length < size) {
    currentLevel.push(BigInt(0));
  }

  const tree = [currentLevel];
  for (let i = 0; i < depth; i++) {
    const nextLevel = [];
    for (let j = 0; j < currentLevel.length; j += 2) {
      nextLevel.push(mockPoseidon([currentLevel[j], currentLevel[j + 1]]));
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  return tree;
}

function getMerkleProof(tree, index, depth) {
  const pathElements = [];
  const pathIndices = [];

  for (let i = 0; i < depth; i++) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    pathElements.push(tree[i][siblingIndex].toString());
    pathIndices.push((index % 2).toString());
    index = Math.floor(index / 2);
  }

  return { pathElements, pathIndices };
}

async function main() {
  const wasmPath = path.join(BUILD_DIR, "vote_verifier_js", "vote_verifier.wasm");
  const zkeyPath = path.join(BUILD_DIR, "vote_verifier_final.zkey");
  const proofPath = path.join(BUILD_DIR, "proof.json");
  const publicPath = path.join(BUILD_DIR, "public.json");

  if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
    console.error("Build artifacts not found. Run 'npm run setup' first.");
    process.exit(1);
  }

  console.log("=== Generating ZK Vote Proof ===\n");

  // Simulate fund with 10 members, 4 voters, quorum of 3
  const maxVoters = 64;
  const merkleDepth = 10;
  const numMembers = 10;
  const numVoters = 4;
  const quorumRequired = 3;

  console.log(`Fund members: ${numMembers}`);
  console.log(`Voters: ${numVoters}`);
  console.log(`Quorum required: ${quorumRequired}`);

  // Generate member secrets and commitments
  const memberSecrets = [];
  for (let i = 0; i < numMembers; i++) {
    memberSecrets.push(BigInt(1000 + i));
  }

  const requestHash = BigInt("123456789");
  const commitments = memberSecrets.map((s) =>
    mockPoseidon([s, requestHash])
  );

  // Build Merkle tree of all member commitments
  const tree = buildMerkleTree(commitments, merkleDepth);
  const merkleRoot = tree[merkleDepth][0];

  // Select first N members as voters
  const voterSecrets = [];
  const merklePaths = [];
  const pathIndicesArr = [];

  for (let i = 0; i < maxVoters; i++) {
    if (i < numVoters) {
      voterSecrets.push(memberSecrets[i].toString());
      const proof = getMerkleProof(tree, i, merkleDepth);
      merklePaths.push(proof.pathElements);
      pathIndicesArr.push(proof.pathIndices);
    } else {
      // Pad unused slots with dummy values
      voterSecrets.push("0");
      merklePaths.push(Array(merkleDepth).fill("0"));
      pathIndicesArr.push(Array(merkleDepth).fill("0"));
    }
  }

  const input = {
    membersMerkleRoot: merkleRoot.toString(),
    requestHash: requestHash.toString(),
    quorumRequired: quorumRequired.toString(),
    voteCount: numVoters.toString(),
    voterSecrets,
    merklePaths,
    pathIndices: pathIndicesArr,
  };

  console.log("\nGenerating proof (this may take a moment)...");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));

  console.log(`\nProof saved to ${proofPath}`);
  console.log(`Public signals saved to ${publicPath}`);
  console.log("\nPublic signals (visible on-chain):");
  console.log(`  - Members Merkle Root: ${publicSignals[0]}`);
  console.log(`  - Request Hash: ${publicSignals[1]}`);
  console.log(`  - Quorum Required: ${publicSignals[2]}`);
  console.log(`  - Vote Count: ${publicSignals[3]}`);
  console.log("\nPrivate data (never revealed): individual voter identities");
}

main().catch(console.error);
