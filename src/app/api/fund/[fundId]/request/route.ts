import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createRequestSchema } from "@/lib/utils/validation";
import {
  getAvailableBalance,
  generateConditionAndFulfillment,
  createEscrow,
  getSignerList,
  calculateEscrowExpiry,
} from "@/lib/xrpl";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  try {
    const { fundId } = await params;
    const body = await request.json();
    const parsed = createRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { requesterAddress, amount, description, documentHash } = parsed.data;

    // 1. Find fund
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      include: { members: true },
    });

    if (!fund) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    // 2. Verify requester is a member
    const member = fund.members.find(
      (m) => m.walletAddress === requesterAddress
    );

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this fund" },
        { status: 403 }
      );
    }

    // 3. Enforce request cap: amount <= member's totalContributed * requestCapMultiplier
    const maxRequestAmount = Math.floor(
      member.totalContributed * fund.requestCapMultiplier
    );
    if (amount > maxRequestAmount) {
      return NextResponse.json(
        {
          error: `Request amount exceeds your cap. Maximum: ${maxRequestAmount} drops (${member.totalContributed} contributed × ${fund.requestCapMultiplier} multiplier)`,
        },
        { status: 400 }
      );
    }

    // 4. Enforce max pool percent
    const availableBalance = await getAvailableBalance(fund.fundWalletAddress);
    const maxPoolAmount = Math.floor(availableBalance * fund.maxPoolPercent);
    if (amount > maxPoolAmount) {
      return NextResponse.json(
        {
          error: `Request amount exceeds pool limit. Maximum: ${maxPoolAmount} drops (${fund.maxPoolPercent * 100}% of available pool)`,
        },
        { status: 400 }
      );
    }

    // 5. Check available balance covers escrow
    if (availableBalance < amount) {
      return NextResponse.json(
        { error: "Insufficient pool balance for this escrow" },
        { status: 400 }
      );
    }

    // 6. Check no pending request from this member
    const existingRequest = await prisma.request.findFirst({
      where: {
        fundId,
        requesterAddress,
        status: { in: ["submitted", "voting", "approved"] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have an active request for this fund" },
        { status: 409 }
      );
    }

    // 7. Generate crypto condition for escrow
    const { condition, fulfillment } = generateConditionAndFulfillment();

    // 8. Create escrow on-chain
    const escrowResult = await createEscrow({
      fundWalletSeed: fund.fundWalletSeed,
      recipientAddress: requesterAddress,
      amountDrops: amount,
      conditionHex: condition,
    });

    // 9. Calculate expiry for DB storage
    const expiry = calculateEscrowExpiry();

    // 10. Save request in database
    const fundRequest = await prisma.request.create({
      data: {
        fundId,
        requesterAddress,
        amount,
        description,
        documentHash,
        escrowSequence: escrowResult.escrowSequence,
        escrowCondition: condition,
        escrowFulfillment: fulfillment,
        status: "voting",
        expiresAt: expiry.date,
      },
    });

    return NextResponse.json(
      {
        id: fundRequest.id,
        fundId: fundRequest.fundId,
        requesterAddress: fundRequest.requesterAddress,
        amount: fundRequest.amount,
        description: fundRequest.description,
        documentHash: fundRequest.documentHash,
        escrowSequence: fundRequest.escrowSequence,
        status: fundRequest.status,
        expiresAt: fundRequest.expiresAt?.toISOString() ?? null,
        createdAt: fundRequest.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/[fundId]/request error:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  try {
    const { fundId } = await params;

    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    const requests = await prisma.request.findMany({
      where: { fundId },
      include: {
        votes: { select: { id: true, voterAddress: true, createdAt: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get signer list to know quorum
    const signerList = await getSignerList(fund.fundWalletAddress);
    const quorumRequired = fund.quorumRequired;

    const result = requests.map((r) => ({
      id: r.id,
      fundId: r.fundId,
      requesterAddress: r.requesterAddress,
      amount: r.amount,
      description: r.description,
      documentHash: r.documentHash,
      escrowSequence: r.escrowSequence,
      status: r.status,
      expiresAt: r.expiresAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      voteCount: r.votes.length,
      quorumRequired,
      signerCount: signerList?.signerEntries.length ?? 0,
      votes: r.votes.map((v) => ({
        id: v.id,
        voterAddress: v.voterAddress,
        createdAt: v.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/fund/[fundId]/request error:", error);
    return NextResponse.json(
      { error: "Failed to list requests" },
      { status: 500 }
    );
  }
}
