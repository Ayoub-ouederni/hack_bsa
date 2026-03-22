import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  buildEscrowFinishTx,
  getSignerList,
} from "@/lib/xrpl";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fundId: string; requestId: string }> }
) {
  try {
    const { fundId, requestId } = await params;

    const fundRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        fund: true,
        votes: {
          select: {
            id: true,
            voterAddress: true,
            createdAt: true,
          },
        },
      },
    });

    if (!fundRequest || fundRequest.fundId !== fundId) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const fund = fundRequest.fund;

    // Get signer list for quorum info
    const signerList = await getSignerList(fund.fundWalletAddress);
    const signerCount = signerList?.signerEntries.length ?? 0;

    // Build unsigned EscrowFinish TX if request is in voting state and has escrow data
    let unsignedTx = null;
    if (
      fundRequest.status === "voting" &&
      fundRequest.escrowSequence !== null &&
      fundRequest.escrowCondition &&
      fundRequest.escrowFulfillment
    ) {
      try {
        unsignedTx = await buildEscrowFinishTx({
          ownerAddress: fund.fundWalletAddress,
          escrowSequence: fundRequest.escrowSequence,
          conditionHex: fundRequest.escrowCondition,
          fulfillmentHex: fundRequest.escrowFulfillment,
          signerCount,
        });
      } catch (err) {
        console.error("Failed to build unsigned EscrowFinish TX:", err);
      }
    }

    const result = {
      id: fundRequest.id,
      fundId: fundRequest.fundId,
      requesterAddress: fundRequest.requesterAddress,
      amount: fundRequest.amount,
      description: fundRequest.description,
      documentHash: fundRequest.documentHash,
      escrowSequence: fundRequest.escrowSequence,
      escrowCondition: fundRequest.escrowCondition,
      status: fundRequest.status,
      expiresAt: fundRequest.expiresAt?.toISOString() ?? null,
      createdAt: fundRequest.createdAt.toISOString(),
      quorumRequired: fund.quorumRequired,
      signerCount,
      votes: fundRequest.votes.map((v) => ({
        id: v.id,
        voterAddress: v.voterAddress,
        createdAt: v.createdAt.toISOString(),
      })),
      voteCount: fundRequest.votes.length,
      unsignedTx,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/fund/[fundId]/request/[requestId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}
