import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { joinFundSchema } from "@/lib/utils/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  try {
    const { fundId } = await params;
    const body = await request.json();
    const parsed = joinFundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 1. Find fund and its members
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

    // Validate invite code
    if (fund.inviteCode !== input.inviteCode) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 403 }
      );
    }

    // Check if already a member (any status)
    const existingMember = fund.members.find(
      (m) => m.walletAddress === input.walletAddress
    );
    if (existingMember) {
      return NextResponse.json(
        { error: "Already a member of this fund" },
        { status: 409 }
      );
    }

    // 2. Create member as "pending" — no on-chain signer, no NFT yet
    //    The organizer must approve before the member becomes active.
    const member = await prisma.member.create({
      data: {
        fundId,
        walletAddress: input.walletAddress,
        signerAddress: input.signerAddress,
        displayName: input.displayName,
        status: "pending",
      },
    });

    return NextResponse.json(
      {
        id: member.id,
        fundId: member.fundId,
        walletAddress: member.walletAddress,
        signerAddress: member.signerAddress,
        displayName: member.displayName,
        status: member.status,
        joinedAt: member.joinedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/[fundId]/members error:", error);
    return NextResponse.json(
      { error: "Failed to join fund" },
      { status: 500 }
    );
  }
}
