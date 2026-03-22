import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  combineSignatures,
  submitMultiSigned,
} from "@/lib/xrpl";

export async function POST(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ fundId: string; requestId: string }> }
) {
  try {
    const { fundId, requestId } = await params;

    // 1. Find request
    const fundRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        fund: true,
        votes: true,
      },
    });

    if (!fundRequest || fundRequest.fundId !== fundId) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // 2. Only allow retry for approved requests (quorum reached but release failed)
    if (fundRequest.status !== "approved") {
      return NextResponse.json(
        {
          error: `Cannot retry release for request with status: ${fundRequest.status}. Only approved requests can be retried.`,
        },
        { status: 400 }
      );
    }

    // 3. Check we have enough votes
    const quorumRequired = fundRequest.fund.quorumRequired;
    if (fundRequest.votes.length < quorumRequired) {
      return NextResponse.json(
        {
          error: `Not enough votes. Have ${fundRequest.votes.length}, need ${quorumRequired}.`,
        },
        { status: 400 }
      );
    }

    // 4. Check expiry
    if (fundRequest.expiresAt && new Date() >= fundRequest.expiresAt) {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: "expired" },
      });
      return NextResponse.json(
        { error: "Request has expired. The escrow can no longer be finished." },
        { status: 400 }
      );
    }

    // 5. Re-collect stored vote blobs and retry
    const signedBlobs = fundRequest.votes.map((v) => v.signature);
    const combinedBlob = combineSignatures(signedBlobs);
    const result = await submitMultiSigned(combinedBlob);

    // 6. Update status to released
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "released" },
    });

    return NextResponse.json({
      released: true,
      txHash: result.txHash,
      resultCode: result.resultCode,
    });
  } catch (error) {
    console.error(
      "POST /api/fund/[fundId]/request/[requestId]/retry-release error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to retry release" },
      { status: 500 }
    );
  }
}
