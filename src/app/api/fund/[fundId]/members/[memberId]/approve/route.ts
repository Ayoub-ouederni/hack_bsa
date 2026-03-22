import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { FUND_RULES } from "@/lib/utils/validation";
import { addSigner, mintMembershipNFT } from "@/lib/xrpl";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ fundId: string; memberId: string }> }
) {
  try {
    const { fundId, memberId } = await params;

    // Get organizer address from header
    const organizerAddress =
      request.headers.get("x-wallet-address") ??
      new URL(request.url).searchParams.get("organizer");

    if (!organizerAddress) {
      return NextResponse.json(
        { error: "Missing organizer wallet address" },
        { status: 400 }
      );
    }

    // 1. Fetch fund and verify organizer
    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      include: { members: { where: { status: "active" } } },
    });

    if (!fund) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    if (fund.organizerAddress !== organizerAddress) {
      return NextResponse.json(
        { error: "Only the fund organizer can approve members" },
        { status: 403 }
      );
    }

    // 2. Fetch the member to approve
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.fundId !== fundId) {
      return NextResponse.json(
        { error: "Member not found in this fund" },
        { status: 404 }
      );
    }

    if (member.status !== "pending") {
      return NextResponse.json(
        { error: "Member is not pending approval" },
        { status: 400 }
      );
    }

    // 3. Add signer to the fund wallet's on-chain signer list
    const activeCount = fund.members.length; // only active members
    const newTotalActive = activeCount + 1;
    const newQuorum = FUND_RULES.getQuorumRequired(newTotalActive);

    await addSigner({
      fundWalletSeed: fund.fundWalletSeed,
      newSigner: { account: member.signerAddress, weight: 1 },
      newQuorum,
    });

    // 4. Mint membership NFT
    const nftResult = await mintMembershipNFT({
      issuerSeed: fund.fundWalletSeed,
      recipientAddress: member.walletAddress,
      fundId,
    });

    // 5. Activate member and update quorum
    const [updatedMember] = await prisma.$transaction([
      prisma.member.update({
        where: { id: memberId },
        data: {
          status: "active",
          nftTokenId: nftResult.nftokenId,
        },
      }),
      prisma.fund.update({
        where: { id: fundId },
        data: { quorumRequired: newQuorum },
      }),
    ]);

    return NextResponse.json({
      id: updatedMember.id,
      fundId: updatedMember.fundId,
      walletAddress: updatedMember.walletAddress,
      signerAddress: updatedMember.signerAddress,
      displayName: updatedMember.displayName,
      status: updatedMember.status,
      nftTokenId: updatedMember.nftTokenId,
      joinedAt: updatedMember.joinedAt.toISOString(),
    });
  } catch (error) {
    console.error(
      "POST /api/fund/[fundId]/members/[memberId]/approve error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to approve member" },
      { status: 500 }
    );
  }
}
