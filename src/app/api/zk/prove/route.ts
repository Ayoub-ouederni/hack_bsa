import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getClient } from "@/lib/xrpl";
import { toHex } from "@/lib/xrpl/payment";
import { Wallet } from "xrpl";
import type { EscrowFinish } from "xrpl";
import { generateVoteProof } from "@/lib/zk/prover";
import { verifyVoteProof } from "@/lib/zk/verifier";

/**
 * POST /api/zk/prove
 *
 * Generates a ZK proof for a fund request vote, verifies it,
 * and releases the escrow if valid.
 *
 * Body: { fundId: string, requestId: string }
 *
 * Flow:
 * 1. Fetch votes from DB
 * 2. Generate ZK proof (proves quorum met without revealing individual votes)
 * 3. Verify the proof
 * 4. Release escrow using fund wallet seed
 * 5. Publish ZK proof hash in transaction Memo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fundId, requestId } = body;

    if (!fundId || !requestId) {
      return NextResponse.json(
        { error: "fundId and requestId are required" },
        { status: 400 }
      );
    }

    // 1. Find request with fund and votes
    const fundRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        fund: { include: { members: true } },
        votes: true,
      },
    });

    if (!fundRequest || fundRequest.fundId !== fundId) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // 2. Check request is in voting or approved state
    if (fundRequest.status !== "voting" && fundRequest.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot generate ZK proof for status: ${fundRequest.status}` },
        { status: 400 }
      );
    }

    // 3. Check expiry
    if (fundRequest.expiresAt && new Date() >= fundRequest.expiresAt) {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Request has expired" },
        { status: 400 }
      );
    }

    // 4. Build votes array (1 = voted, 0 = did not vote)
    const activeMembers = fundRequest.fund.members.filter(
      (m) => m.status === "active"
    );
    const voterAddresses = new Set(
      fundRequest.votes.map((v) => v.voterAddress)
    );
    const votes = activeMembers.map((m) =>
      voterAddresses.has(m.walletAddress) ? 1 : 0
    );

    const quorum = fundRequest.fund.quorumRequired;
    const voterCount = activeMembers.length;

    // 5. Generate ZK proof
    let zkProof;
    try {
      zkProof = await generateVoteProof({ votes, quorum, voterCount });
    } catch (error) {
      console.error("ZK proof generation failed:", error);
      return NextResponse.json(
        { error: "Quorum not met — cannot generate ZK proof" },
        { status: 400 }
      );
    }

    // 6. Verify the proof server-side
    const verification = await verifyVoteProof(
      zkProof.proof,
      zkProof.publicSignals
    );

    if (!verification.valid) {
      return NextResponse.json(
        { error: "ZK proof verification failed" },
        { status: 500 }
      );
    }

    // 7. Release escrow using fund wallet seed (same as retry-release)
    if (
      fundRequest.escrowSequence === null ||
      !fundRequest.escrowCondition ||
      !fundRequest.escrowFulfillment
    ) {
      return NextResponse.json(
        { error: "Missing escrow data on this request" },
        { status: 400 }
      );
    }

    const fund = fundRequest.fund;
    const wallet = Wallet.fromSeed(fund.fundWalletSeed);
    const client = await getClient();
    const currentLedger = await client.getLedgerIndex();

    const tx: EscrowFinish = {
      TransactionType: "EscrowFinish",
      Account: wallet.address,
      Owner: fund.fundWalletAddress,
      OfferSequence: fundRequest.escrowSequence,
      Condition: fundRequest.escrowCondition,
      Fulfillment: fundRequest.escrowFulfillment,
      LastLedgerSequence: currentLedger + 75,
      Memos: [
        {
          Memo: {
            MemoType: toHex("pulse/zk-proof"),
            MemoData: toHex(
              JSON.stringify({
                proofHash: zkProof.proofHash,
                yesVotes: zkProof.yesVotes,
                quorum: zkProof.quorum,
                voterCount: zkProof.voterCount,
                generatedAt: zkProof.generatedAt,
              })
            ),
          },
        },
      ],
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta as
      | { TransactionResult?: string }
      | undefined;
    const resultCode = meta?.TransactionResult ?? "unknown";

    if (resultCode !== "tesSUCCESS") {
      // Mark as approved so retry is possible
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "approved" },
      });
      throw new Error(`EscrowFinish failed: ${resultCode}`);
    }

    // 8. Update status to released
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "released" },
    });

    return NextResponse.json({
      released: true,
      txHash: result.result.hash,
      resultCode,
      zkProof: {
        proofHash: zkProof.proofHash,
        yesVotes: zkProof.yesVotes,
        quorumMet: zkProof.quorumMet,
        quorum: zkProof.quorum,
        voterCount: zkProof.voterCount,
        generatedAt: zkProof.generatedAt,
      },
    });
  } catch (error) {
    console.error("POST /api/zk/prove error:", error);
    const message =
      error instanceof Error ? error.message : "ZK proof generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
