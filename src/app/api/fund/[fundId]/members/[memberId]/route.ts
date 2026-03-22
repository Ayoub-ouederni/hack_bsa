import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { removeSigner, burnMembershipNFT } from "@/lib/xrpl";

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ fundId: string; memberId: string }> }
) {
  try {
    const { fundId, memberId } = await params;

    // Get the organizer address from the request header or query
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
    });

    if (!fund) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    if (fund.organizerAddress !== organizerAddress) {
      return NextResponse.json(
        { error: "Only the fund organizer can remove members" },
        { status: 403 }
      );
    }

    // 2. Fetch the member to remove
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member || member.fundId !== fundId) {
      return NextResponse.json(
        { error: "Member not found in this fund" },
        { status: 404 }
      );
    }

    // Cannot remove organizer themselves
    if (member.walletAddress === fund.organizerAddress) {
      return NextResponse.json(
        { error: "Cannot remove the fund organizer" },
        { status: 400 }
      );
    }

    // 3. Remove signer from on-chain signer list
    await removeSigner({
      fundWalletSeed: fund.fundWalletSeed,
      signerAddress: member.signerAddress,
    });

    // 4. Burn membership NFT if it exists
    if (member.nftTokenId) {
      try {
        await burnMembershipNFT({
          issuerSeed: fund.fundWalletSeed,
          nftokenId: member.nftTokenId,
          holderAddress: fund.fundWalletAddress,
        });
      } catch (nftError) {
        // NFT burn failure is non-critical — log but continue
        console.error("Failed to burn membership NFT:", nftError);
      }
    }

    // 5. Delete member from database
    await prisma.member.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /api/fund/[fundId]/members/[memberId] error:",
      error
    );
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
