import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { castVoteSchema } from "@/lib/utils/validation";
import {
  combineSignatures,
  submitMultiSigned,
  getSignerList,
} from "@/lib/xrpl";

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

    // 5. Verify voter's signer address matches
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
      // Quorum reached — attempt auto-release
      try {
        // Collect all signed blobs (including the one just cast)
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

        // Mark as approved (quorum reached but release failed)
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
