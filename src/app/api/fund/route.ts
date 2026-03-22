import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createFundSchema, FUND_RULES } from "@/lib/utils/validation";
import {
  createTestnetWallet,
  getWalletInfo,
  setupSignerList,
  mintMembershipNFT,
} from "@/lib/xrpl";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createFundSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 1. Create fund wallet on testnet
    const { wallet } = await createTestnetWallet();
    const walletInfo = getWalletInfo(wallet);

    // 2. Setup initial signer list with organizer as first signer
    // The organizer needs a signer address — but at creation time, we set up
    // an empty-ish signer list. Members will be added via the join endpoint.
    // We use the organizer address as initial signer so the list is valid.
    await setupSignerList({
      fundWalletSeed: walletInfo.seed,
      signerEntries: [{ account: input.organizerAddress, weight: 1 }],
      signerQuorum: 1,
    });

    // 3. Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.fund.findUnique({
        where: { inviteCode },
      });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // 4. Create fund in database with organizer as first member
    const fund = await prisma.fund.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        organizerAddress: input.organizerAddress,
        fundWalletAddress: walletInfo.address,
        fundWalletSeed: walletInfo.seed,
        quorumRequired: FUND_RULES.getQuorumRequired(1),
        minContribution: input.minContribution,
        requestCapMultiplier: FUND_RULES.requestCapMultiplier,
        maxPoolPercent: FUND_RULES.maxPoolPercent,
        inviteCode,
        members: {
          create: {
            walletAddress: input.organizerAddress,
            signerAddress: input.organizerAddress,
            displayName: "Organizer",
          },
        },
      },
    });

    // 5. Mint membership NFT for organizer
    try {
      const nftResult = await mintMembershipNFT({
        issuerSeed: walletInfo.seed,
        recipientAddress: input.organizerAddress,
        fundId: fund.id,
      });

      // Update the organizer member with NFT token ID
      await prisma.member.updateMany({
        where: { fundId: fund.id, walletAddress: input.organizerAddress },
        data: { nftTokenId: nftResult.nftokenId },
      });
    } catch (nftError) {
      console.error("Failed to mint organizer NFT (fund still created):", nftError);
    }

    return NextResponse.json(
      {
        id: fund.id,
        name: fund.name,
        fundWalletAddress: fund.fundWalletAddress,
        inviteCode: fund.inviteCode,
        createdAt: fund.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/fund error:", error);
    return NextResponse.json(
      { error: "Failed to create fund" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet");
    const inviteCode = searchParams.get("invite");

    // Lookup fund by invite code
    if (inviteCode) {
      const fund = await prisma.fund.findUnique({
        where: { inviteCode },
        include: {
          members: true,
          _count: { select: { requests: true } },
        },
      });

      if (!fund) {
        return NextResponse.json(
          { error: "Invalid invite code" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: fund.id,
        name: fund.name,
        description: fund.description,
        organizerAddress: fund.organizerAddress,
        fundWalletAddress: fund.fundWalletAddress,
        quorumRequired: fund.quorumRequired,
        minContribution: fund.minContribution,
        requestCapMultiplier: fund.requestCapMultiplier,
        maxPoolPercent: fund.maxPoolPercent,
        inviteCode: fund.inviteCode,
        createdAt: fund.createdAt.toISOString(),
        memberCount: fund.members.length,
        requestCount: fund._count.requests,
      });
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing wallet or invite query parameter" },
        { status: 400 }
      );
    }

    // Find funds where the wallet is organizer or a member
    const funds = await prisma.fund.findMany({
      where: {
        OR: [
          { organizerAddress: walletAddress },
          { members: { some: { walletAddress } } },
        ],
      },
      include: {
        members: true,
        _count: { select: { requests: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = funds.map((fund) => ({
      id: fund.id,
      name: fund.name,
      description: fund.description,
      organizerAddress: fund.organizerAddress,
      fundWalletAddress: fund.fundWalletAddress,
      quorumRequired: fund.quorumRequired,
      minContribution: fund.minContribution,
      requestCapMultiplier: fund.requestCapMultiplier,
      maxPoolPercent: fund.maxPoolPercent,
      inviteCode: fund.inviteCode,
      createdAt: fund.createdAt.toISOString(),
      memberCount: fund.members.length,
      requestCount: fund._count.requests,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/fund error:", error);
    return NextResponse.json(
      { error: "Failed to list funds" },
      { status: 500 }
    );
  }
}
