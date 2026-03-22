/**
 * setup.js — Compile the circuit and generate proving/verification keys
 *
 * Steps:
 *   1. Compile vote_verifier.circom → WASM + R1CS
 *   2. Use existing Powers of Tau ceremony (pot12_final.ptau)
 *   3. Generate circuit-specific zkey (Groth16)
 *   4. Export verification key (JSON)
 *
 * Prerequisites: circom compiler installed (https://docs.circom.io)
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const snarkjs = require("snarkjs");

const CIRCUITS_DIR = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(CIRCUITS_DIR, "build");

async function main() {
  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
  }

  console.log("=== Step 1: Compiling circuit ===");
  try {
    execSync(
      `circom ${path.join(CIRCUITS_DIR, "vote_verifier.circom")} ` +
        `--r1cs --wasm --sym ` +
        `-o ${BUILD_DIR} ` +
        `-l ${path.join(CIRCUITS_DIR, "node_modules")}`,
      { stdio: "inherit" }
    );
    console.log("Circuit compiled successfully.\n");
  } catch (e) {
    console.error("Failed to compile circuit. Is circom installed?");
    console.error("Install: https://docs.circom.io/getting-started/installation/");
    process.exit(1);
  }

  const r1csPath = path.join(BUILD_DIR, "vote_verifier.r1cs");
  const ptauPath = path.join(CIRCUITS_DIR, "pot12_final.ptau");
  const zkeyPath = path.join(BUILD_DIR, "vote_verifier.zkey");
  const vkeyPath = path.join(BUILD_DIR, "verification_key.json");

  console.log("=== Step 2: Generating zkey (Groth16 setup) ===");
  await snarkjs.zKey.newZKey(r1csPath, ptauPath, zkeyPath);
  console.log("zkey generated.\n");

  console.log("=== Step 3: Contributing to ceremony ===");
  const zkeyFinalPath = path.join(BUILD_DIR, "vote_verifier_final.zkey");
  await snarkjs.zKey.contribute(zkeyPath, zkeyFinalPath, "Pulse ZK Ceremony", "pulse-random-entropy-hackathon-2026");
  console.log("Contribution added.\n");

  console.log("=== Step 4: Exporting verification key ===");
  const vkey = await snarkjs.zKey.exportVerificationKey(zkeyFinalPath);
  fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
  console.log(`Verification key saved to ${vkeyPath}\n`);

  console.log("Setup complete! Ready to generate proofs.");
}

main().catch(console.error);
