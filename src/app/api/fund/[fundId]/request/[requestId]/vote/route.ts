import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { castVoteSchema } from "@/lib/utils/validation";
import {
  combineSignatures,
  submitMultiSigned,
  getSignerList,
} from "@/lib/xrpl";
import { generateVoteProof } from "@/lib/zk/prover";
import { verifyVoteProof } from "@/lib/zk/verifier";
import { toHex } from "@/lib/xrpl/payment";
import { getClient } from "@/lib/xrpl";
import { Wallet } from "xrpl";
import type { EscrowFinish } from "xrpl";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ fundId: string; requestId: string }> }
) {
  try {
    const { fundId, requestId } = await params;
    const body = await request.json();
    const parsed = castVoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { voterAddress, signerAddress, signedTxBlob } = parsed.data;

    // 1. Find request and fund
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

    // 2. Check request is in voting state
    if (fundRequest.status !== "voting") {
      return NextResponse.json(
        { error: `Request is not open for voting (status: ${fundRequest.status})` },
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

    // 4. Verify voter is an active member
    const member = fundRequest.fund.members.find(
      (m) => m.walletAddress === voterAddress && m.status === "active"
    );
    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this fund" },
        { status: 403 }
      );
    }

    // 5. Verify voter has contributed to the fund
    if (member.totalContributed <= 0) {
      return NextResponse.json(
        { error: "You must contribute to the fund before you can vote" },
        { status: 403 }
      );
    }

    // 6. Verify voter's signer address matches
    if (member.signerAddress !== signerAddress) {
      return NextResponse.json(
        { error: "Signer address does not match member record" },
        { status: 400 }
      );
    }

    // 6. Prevent self-voting (requester cannot vote on their own request)
    if (voterAddress === fundRequest.requesterAddress) {
      return NextResponse.json(
        { error: "You cannot vote on your own request" },
        { status: 400 }
      );
    }

    // 7. Check for duplicate vote
    const existingVote = fundRequest.votes.find(
      (v) => v.voterAddress === voterAddress
    );
    if (existingVote) {
      return NextResponse.json(
        { error: "You have already voted on this request" },
        { status: 409 }
      );
    }

    // 8. Store the vote
    const vote = await prisma.vote.create({
      data: {
        requestId,
        voterAddress,
        signature: signedTxBlob,
      },
    });

    // 9. Check quorum
    const totalVotes = fundRequest.votes.length + 1; // existing + this new one
    const quorumRequired = fundRequest.fund.quorumRequired;

    if (totalVotes >= quorumRequired) {
      // Count active members to decide: multi-sign (≤32) or ZK proof (>32)
      const activeMembers = fundRequest.fund.members.filter(
        (m) => m.status === "active"
      );
      const useZkPath = activeMembers.length > 32;

      if (useZkPath) {
        // ─── ZK PROOF PATH (>32 members) ───
        try {
          // Build votes array: 1 = voted, 0 = did not vote
          const allDbVotes = await prisma.vote.findMany({
            where: { requestId },
          });
          const voterAddresses = new Set(allDbVotes.map((v) => v.voterAddress));
          const votesArray = activeMembers.map((m) =>
            voterAddresses.has(m.walletAddress) ? 1 : 0
          );

          // Generate ZK proof
          const zkProof = await generateVoteProof({
            votes: votesArray,
            quorum: quorumRequired,
            voterCount: activeMembers.length,
          });

          // Verify the proof
          const verification = await verifyVoteProof(
            zkProof.proof,
            zkProof.publicSignals
          );

          if (!verification.valid) {
            throw new Error("ZK proof verification failed");
          }

          // Release escrow using fund wallet seed
          if (
            fundRequest.escrowSequence === null ||
            !fundRequest.escrowCondition ||
            !fundRequest.escrowFulfillment
          ) {
            throw new Error("Missing escrow data on this request");
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
            throw new Error(`EscrowFinish failed: ${resultCode}`);
          }

          await prisma.request.update({
            where: { id: requestId },
            data: { status: "released" },
          });

          return NextResponse.json(
            {
              vote: {
                id: vote.id,
                voterAddress: vote.voterAddress,
                createdAt: vote.createdAt.toISOString(),
              },
              quorumReached: true,
              released: true,
              releaseTxHash: result.result.hash,
              zkProof: {
                proofHash: zkProof.proofHash,
                yesVotes: zkProof.yesVotes,
                quorumMet: zkProof.quorumMet,
                quorum: zkProof.quorum,
                voterCount: zkProof.voterCount,
                generatedAt: zkProof.generatedAt,
              },
              totalVotes,
              quorumRequired,
            },
            { status: 201 }
          );
        } catch (zkError) {
          console.error("ZK proof release failed after quorum:", zkError);

          await prisma.request.update({
            where: { id: requestId },
            data: { status: "approved" },
          });

          return NextResponse.json(
            {
              vote: {
                id: vote.id,
                voterAddress: vote.voterAddress,
                createdAt: vote.createdAt.toISOString(),
              },
              quorumReached: true,
              released: false,
              releaseError: "ZK proof release failed. Use retry-release to try again.",
              totalVotes,
              quorumRequired,
            },
            { status: 201 }
          );
        }
      } else {
        // ─── MULTI-SIGN PATH (≤32 members) ───
        try {
          const allVotes = await prisma.vote.findMany({
            where: { requestId },
          });

          const signedBlobs = allVotes.map((v) => v.signature);

          // Combine signatures and submit
          const combinedBlob = combineSignatures(signedBlobs);
          const result = await submitMultiSigned(combinedBlob);

          // Update request status to released
          await prisma.request.update({
            where: { id: requestId },
            data: { status: "released" },
          });

          return NextResponse.json(
            {
              vote: {
                id: vote.id,
                voterAddress: vote.voterAddress,
                createdAt: vote.createdAt.toISOString(),
              },
              quorumReached: true,
              released: true,
              releaseTxHash: result.txHash,
              totalVotes,
              quorumRequired,
            },
            { status: 201 }
          );
        } catch (releaseError) {
          console.error("Auto-release failed after quorum:", releaseError);

          await prisma.request.update({
            where: { id: requestId },
            data: { status: "approved" },
          });

          return NextResponse.json(
            {
              vote: {
                id: vote.id,
                voterAddress: vote.voterAddress,
                createdAt: vote.createdAt.toISOString(),
              },
              quorumReached: true,
              released: false,
              releaseError: "Release failed. Use retry-release to try again.",
              totalVotes,
              quorumRequired,
            },
            { status: 201 }
          );
        }
      }
    }

    // Quorum not yet reached
    return NextResponse.json(
      {
        vote: {
          id: vote.id,
          voterAddress: vote.voterAddress,
          createdAt: vote.createdAt.toISOString(),
        },
        quorumReached: false,
        released: false,
        totalVotes,
        quorumRequired,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/[fundId]/request/[requestId]/vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}
