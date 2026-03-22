import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getClient } from "@/lib/xrpl";
import type { EscrowFinish } from "xrpl";
import { Wallet } from "xrpl";

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

    // 5. Finish the escrow directly using the fund wallet seed
    //    (quorum was already validated by votes — old multi-signed blobs have expired LastLedgerSequence)
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
    };

    const prepared = await client.autofill(tx);
    const signed = wallet.sign(prepared);
    const result = await client.submitAndWait(signed.tx_blob);

    const meta = result.result.meta as { TransactionResult?: string } | undefined;
    const resultCode = meta?.TransactionResult ?? "unknown";

    if (resultCode !== "tesSUCCESS") {
      throw new Error(`EscrowFinish failed: ${resultCode}`);
    }

    // 6. Update status to released
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "released" },
    });

    return NextResponse.json({
      released: true,
      txHash: result.result.hash,
      resultCode,
    });
  } catch (error) {
    console.error(
      "POST /api/fund/[fundId]/request/[requestId]/retry-release error:",
      error
    );
    const message =
      error instanceof Error ? error.message : "Failed to retry release";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
