import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { PoolHealth } from "@/types/fund";

function computePoolHealth(
  balance: number,
  memberCount: number
): PoolHealth {
  if (memberCount === 0 || balance === 0) return "critical";
  const perMember = balance / memberCount;
  // healthy if pool has at least 10 XRP (10M drops) per member
  if (perMember >= 10_000_000) return "healthy";
  // warning if at least 1 XRP per member
  if (perMember >= 1_000_000) return "warning";
  return "critical";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ fundId: string }> }
) {
  try {
    const { fundId } = await params;

    const fund = await prisma.fund.findUnique({
      where: { id: fundId },
      include: {
        members: {
          include: {
            contributions: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        requests: {
          include: { votes: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!fund) {
      return NextResponse.json(
        { error: "Fund not found" },
        { status: 404 }
      );
    }

    // Pool balance = total contributions minus released amounts
    const totalContributed = fund.members.reduce(
      (sum, m) => sum + m.totalContributed,
      0
    );
    const totalReleased = fund.requests
      .filter((r) => r.status === "released")
      .reduce((sum, r) => sum + r.amount, 0);
    const poolBalance = Math.max(0, totalContributed - totalReleased);

    const activeMembers = fund.members.filter((m) => m.status === "active");
    const pendingMembers = fund.members.filter((m) => m.status === "pending");

    // Filter active requests for the response
    const activeRequests = fund.requests.filter((r) =>
      ["submitted", "voting", "approved"].includes(r.status)
    );

    const poolHealth = computePoolHealth(poolBalance, activeMembers.length);

    // Collect recent contributions across all members
    const recentContributions = fund.members
      .flatMap((member) =>
        member.contributions.map((c) => ({
          id: c.id,
          memberId: c.memberId,
          amount: c.amount,
          txHash: c.txHash,
          createdAt: c.createdAt.toISOString(),
          memberName: member.displayName,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);

    const result = {
      fund: {
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
      },
      poolBalance,
      poolHealth,
      members: activeMembers.map((m) => ({
        id: m.id,
        fundId: m.fundId,
        walletAddress: m.walletAddress,
        signerAddress: m.signerAddress,
        displayName: m.displayName,
        totalContributed: m.totalContributed,
        lastContribution: m.lastContribution?.toISOString() ?? null,
        status: m.status,
        nftTokenId: m.nftTokenId,
        joinedAt: m.joinedAt.toISOString(),
      })),
      pendingMembers: pendingMembers.map((m) => ({
        id: m.id,
        fundId: m.fundId,
        walletAddress: m.walletAddress,
        displayName: m.displayName,
        status: m.status,
        joinedAt: m.joinedAt.toISOString(),
      })),
      activeRequests: activeRequests.map((r) => ({
        id: r.id,
        fundId: r.fundId,
        requesterAddress: r.requesterAddress,
        amount: r.amount,
        description: r.description,
        documentHash: r.documentHash,
        escrowSequence: r.escrowSequence,
        escrowCondition: r.escrowCondition,
        status: r.status,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        voteCount: r.votes.length,
      })),
      recentContributions,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/fund/[fundId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fund" },
      { status: 500 }
    );
  }
}
