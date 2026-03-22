import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { joinFundSchema, FUND_RULES } from "@/lib/utils/validation";
import { addSigner, mintMembershipNFT } from "@/lib/xrpl";

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

    // 1. Find fund by invite code
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

    // Check if already a member
    const existingMember = fund.members.find(
      (m) => m.walletAddress === input.walletAddress
    );
    if (existingMember) {
      return NextResponse.json(
        { error: "Already a member of this fund" },
        { status: 409 }
      );
    }

    // 2. Add signer to the fund wallet's on-chain signer list
    await addSigner({
      fundWalletSeed: fund.fundWalletSeed,
      newSigner: { account: input.signerAddress, weight: 1 },
    });

    // 3. Mint membership NFT
    const nftResult = await mintMembershipNFT({
      issuerSeed: fund.fundWalletSeed,
      recipientAddress: input.walletAddress,
      fundId,
    });

    // 4. Create member in database
    const member = await prisma.member.create({
      data: {
        fundId,
        walletAddress: input.walletAddress,
        signerAddress: input.signerAddress,
        displayName: input.displayName,
        nftTokenId: nftResult.nftokenId,
      },
    });

    // 5. Recalculate quorum (50% of total members including organizer)
    const totalMembers = fund.members.length + 1; // existing + new member
    const newQuorum = FUND_RULES.getQuorumRequired(totalMembers);
    await prisma.fund.update({
      where: { id: fundId },
      data: { quorumRequired: newQuorum },
    });

    return NextResponse.json(
      {
        id: member.id,
        fundId: member.fundId,
        walletAddress: member.walletAddress,
        signerAddress: member.signerAddress,
        displayName: member.displayName,
        nftTokenId: member.nftTokenId,
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
