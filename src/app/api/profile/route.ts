import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isValidClassicAddress } from "xrpl";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get("wallet");

    if (!wallet || !isValidClassicAddress(wallet)) {
      return NextResponse.json(
        { error: "Missing or invalid wallet address" },
        { status: 400 }
      );
    }

    // Get or create profile
    const profile = await prisma.profile.upsert({
      where: { walletAddress: wallet },
      update: {},
      create: { walletAddress: wallet },
    });

    // Get all memberships with fund info and NFT token IDs
    const memberships = await prisma.member.findMany({
      where: { walletAddress: wallet },
      include: {
        fund: {
          select: {
            id: true,
            name: true,
            description: true,
            fundWalletAddress: true,
            organizerAddress: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json({
      profile: {
        walletAddress: profile.walletAddress,
        displayName: profile.displayName,
        bio: profile.bio,
        avatarBase64: profile.avatarBase64,
      },
      memberships: memberships.map((m) => ({
        id: m.id,
        fundId: m.fundId,
        fundName: m.fund.name,
        fundDescription: m.fund.description,
        fundWalletAddress: m.fund.fundWalletAddress,
        isOrganizer: m.fund.organizerAddress === wallet,
        displayName: m.displayName,
        totalContributed: m.totalContributed,
        nftTokenId: m.nftTokenId,
        joinedAt: m.joinedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, displayName, bio, avatarBase64 } = body;

    if (!walletAddress || !isValidClassicAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Missing or invalid wallet address" },
        { status: 400 }
      );
    }

    if (displayName !== undefined && typeof displayName !== "string") {
      return NextResponse.json(
        { error: "Invalid displayName" },
        { status: 400 }
      );
    }

    if (bio !== undefined && typeof bio !== "string") {
      return NextResponse.json({ error: "Invalid bio" }, { status: 400 });
    }

    // Validate avatar size (max ~500KB base64)
    if (avatarBase64 && avatarBase64.length > 700_000) {
      return NextResponse.json(
        { error: "Avatar too large (max 500KB)" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.upsert({
      where: { walletAddress },
      update: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatarBase64 !== undefined && { avatarBase64 }),
      },
      create: {
        walletAddress,
        ...(displayName && { displayName }),
        ...(bio && { bio }),
        ...(avatarBase64 && { avatarBase64 }),
      },
    });

    return NextResponse.json({
      walletAddress: profile.walletAddress,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarBase64: profile.avatarBase64,
    });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
