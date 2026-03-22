import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { contributeSchema } from "@/lib/utils/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  try {
    const { fundId } = await params;
    const body = await request.json();
    const parsed = contributeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { walletAddress, amount, txHash } = parsed.data;

    // 1. Find fund and verify it exists
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

    // 2. Verify the sender is an active member of this fund
    const member = fund.members.find(
      (m) => m.walletAddress === walletAddress && m.status === "active"
    );

    if (!member) {
      return NextResponse.json(
        { error: "Not a member of this fund" },
        { status: 403 }
      );
    }

    // 3. Enforce minimum contribution
    if (amount < fund.minContribution) {
      return NextResponse.json(
        { error: `Minimum contribution is ${fund.minContribution} drops` },
        { status: 400 }
      );
    }

    // 4. Check for duplicate txHash
    const existingContribution = await prisma.contribution.findUnique({
      where: { txHash },
    });

    if (existingContribution) {
      return NextResponse.json(
        { error: "Transaction already recorded" },
        { status: 409 }
      );
    }

    // 5. Create contribution and update member totals in a transaction
    const now = new Date();
    const [contribution] = await prisma.$transaction([
      prisma.contribution.create({
        data: {
          memberId: member.id,
          amount,
          txHash,
        },
      }),
      prisma.member.update({
        where: { id: member.id },
        data: {
          totalContributed: { increment: amount },
          lastContribution: now,
        },
      }),
    ]);

    return NextResponse.json(
      {
        id: contribution.id,
        memberId: contribution.memberId,
        amount: contribution.amount,
        txHash: contribution.txHash,
        createdAt: contribution.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund/[fundId]/contribute error:", error);
    return NextResponse.json(
      { error: "Failed to record contribution" },
      { status: 500 }
    );
  }
}
