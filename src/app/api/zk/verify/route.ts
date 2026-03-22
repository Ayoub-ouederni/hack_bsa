import { NextRequest, NextResponse } from "next/server";
import { verifyVoteProof } from "@/lib/zk/verifier";
import type { Groth16Proof, PublicSignals } from "@/lib/zk/types";

/**
 * POST /api/zk/verify
 *
 * Verifies a ZK vote proof independently.
 * Anyone can call this to verify a proof is valid.
 *
 * Body: { proof: Groth16Proof, publicSignals: PublicSignals }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proof, publicSignals } = body;

    if (!proof || !publicSignals) {
      return NextResponse.json(
        { error: "proof and publicSignals are required" },
        { status: 400 }
      );
    }

    const result = await verifyVoteProof(
      proof as Groth16Proof,
      publicSignals as PublicSignals
    );

    return NextResponse.json({
      valid: result.valid,
      yesVotes: result.yesVotes,
      quorumMet: result.quorumMet,
      quorum: result.quorum,
      voterCount: result.voterCount,
    });
  } catch (error) {
    console.error("POST /api/zk/verify error:", error);
    const message =
      error instanceof Error ? error.message : "ZK proof verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
