/**
 * verify_proof.js — Verify a ZK vote proof off-chain
 *
 * Demonstrates that anyone can verify the proof is valid
 * using only the public signals and verification key,
 * without knowing who actually voted.
 */

const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

const BUILD_DIR = path.resolve(__dirname, "..", "build");

async function main() {
  const proofPath = path.join(BUILD_DIR, "proof.json");
  const publicPath = path.join(BUILD_DIR, "public.json");
  const vkeyPath = path.join(BUILD_DIR, "verification_key.json");

  if (!fs.existsSync(proofPath) || !fs.existsSync(publicPath) || !fs.existsSync(vkeyPath)) {
    console.error("Missing files. Run 'npm run setup' then 'npm run generate-proof' first.");
    process.exit(1);
  }

  const proof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
  const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf-8"));
  const vkey = JSON.parse(fs.readFileSync(vkeyPath, "utf-8"));

  console.log("=== Verifying ZK Vote Proof ===\n");
  console.log("Public signals:");
  console.log(`  - Members Merkle Root: ${publicSignals[0]}`);
  console.log(`  - Request Hash: ${publicSignals[1]}`);
  console.log(`  - Quorum Required: ${publicSignals[2]}`);
  console.log(`  - Vote Count: ${publicSignals[3]}`);

  console.log("\nVerifying proof...");
  const isValid = await snarkjs.groth16.verify(vkey, publicSignals, proof);

  if (isValid) {
    console.log("\n✅ PROOF VALID");
    console.log("The quorum was legitimately reached by valid fund members.");
    console.log("No individual voter identity was revealed.");
  } else {
    console.log("\n❌ PROOF INVALID");
    console.log("The proof could not be verified. Votes may be fraudulent.");
  }

  // Show proof size (demonstrates compactness)
  const proofSize = JSON.stringify(proof).length;
  console.log(`\nProof size: ${proofSize} bytes`);
  console.log("(Same size whether 4 or 400 people voted — that's the power of ZK!)");
}

main().catch(console.error);
