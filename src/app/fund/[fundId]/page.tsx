"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Copy,
  Check,
  AlertCircle,
  HandCoins,
  Plus,
  ExternalLink,
  ChevronDown,
  History,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFundDashboard } from "@/lib/hooks/useFund";
import { useRequests } from "@/lib/hooks/useRequest";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { HeartbeatPulse } from "@/components/animations/HeartbeatPulse";
import { PoolStats, PoolStatsSkeleton } from "@/components/fund/PoolStats";
import { MemberList, MemberListSkeleton } from "@/components/fund/MemberList";
import { RequestCard } from "@/components/request/RequestCard";
import {
  ContributionHistory,
  ContributionHistorySkeleton,
} from "@/components/fund/ContributionHistory";
import type { RequestStatus } from "@/types/request";

function formatXrp(drops: number): string {
  return (drops / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getTimeRemaining(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;
  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMin = minutes % 60;
  return `${hours}h ${remainingMin}m`;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-[300px] w-[300px] rounded-full" />
      </div>
      <PoolStatsSkeleton />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <MemberListSkeleton />
          <ContributionHistorySkeleton />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invite code copy button
// ---------------------------------------------------------------------------

function InviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-mono text-[#6B7280] transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {code}
        </>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Not connected
// ---------------------------------------------------------------------------

function NotConnectedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-24 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9E6]">
        <AlertCircle className="h-8 w-8 text-[#F5A623]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[#1A1A2E]">
          Connect your wallet
        </h2>
        <p className="max-w-sm text-sm text-[#6B7280]">
          Connect your wallet to view the fund dashboard and interact with the
          community.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

function FundDashboardContent({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { address } = useWallet();
  const {
    data: dashboard,
    isLoading,
    error,
    mutate,
  } = useFundDashboard(fundId);
  const { data: allRequests } = useRequests(fundId);
  const [showHistory, setShowHistory] = useState(false);

  const pastRequests = useMemo(
    () =>
      allRequests
        ? allRequests.filter(
            (r) =>
              r.status === "released" ||
              r.status === "expired" ||
              r.status === "cancelled"
          )
        : [],
    [allRequests]
  );

  if (isLoading) return <DashboardSkeleton />;

  if (error || !dashboard) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-24 text-center"
      >
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h2 className="text-lg font-semibold text-[#1A1A2E]">
          Fund not found
        </h2>
        <p className="text-sm text-[#6B7280]">
          This fund may have been deleted or the link is incorrect.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-[#1A1A2E] transition-colors hover:border-[#F5A623] hover:bg-[#FFF9E6]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </motion.div>
    );
  }

  const {
    fund,
    poolBalance,
    poolHealth,
    members,
    pendingMembers,
    activeRequests,
    recentContributions,
  } = dashboard;

  const memberNameMap = new Map(
    members.map((m) => [m.walletAddress, m.displayName])
  );

  const requestsToShow = allRequests
    ? allRequests.filter(
        (r) =>
          r.status === "submitted" ||
          r.status === "voting" ||
          r.status === "approved"
      )
    : activeRequests;

  const activeRelease = activeRequests.find(
    (r) => r.status === "approved" || r.status === "voting"
  );

  const lastContrib = recentContributions[0];
  const poolTarget = fund.minContribution * Math.max(members.length, 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#1A1A2E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold tracking-tight text-[#1A1A2E] md:text-3xl"
          >
            {fund.name}
          </motion.h1>
          {fund.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-[#6B7280]"
            >
              {fund.description}
            </motion.p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-2"
        >
          <InviteCodeButton code={fund.inviteCode} />
          <a
            href={`https://testnet.xrpl.org/accounts/${fund.fundWalletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs text-[#6B7280] transition-colors hover:bg-gray-50 hover:text-[#1A1A2E]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on ledger
          </a>
        </motion.div>
      </div>

      {/* ---- HeartbeatPulse ---- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="flex justify-center"
      >
        <HeartbeatPulse
          poolBalance={Math.round(poolBalance / 1_000_000)}
          poolTarget={Math.round(poolTarget / 1_000_000)}
          status={poolHealth}
          lastContribution={
            lastContrib
              ? {
                  amount: Math.round(lastContrib.amount / 1_000_000),
                  timestamp: new Date(lastContrib.createdAt).getTime(),
                }
              : undefined
          }
          activeRelease={
            activeRelease
              ? {
                  amount: Math.round(activeRelease.amount / 1_000_000),
                  recipientName:
                    memberNameMap.get(activeRelease.requesterAddress) ??
                    activeRelease.requesterAddress.slice(0, 8),
                }
              : undefined
          }
        />
      </motion.div>

      {/* ---- Action buttons ---- */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-3"
      >
        <Link
          href={`/fund/${fundId}/contribute`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 font-medium text-white transition-colors hover:bg-[#E09000]"
        >
          <HandCoins className="h-4 w-4" />
          Contribute
        </Link>
        <Link
          href={`/fund/${fundId}/request`}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-[#1A1A2E] transition-colors hover:border-[#F5A623] hover:bg-[#FFF9E6]"
        >
          <Plus className="h-4 w-4" />
          Request help
        </Link>
      </motion.div>

      {/* ---- Stats cards row ---- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <PoolStats
          poolBalance={poolBalance}
          poolHealth={poolHealth}
          memberCount={members.length}
          quorumRequired={fund.quorumRequired}
          minContribution={fund.minContribution}
          activeRequestCount={activeRequests.length}
        />
      </motion.div>

      {/* ---- Main grid ---- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Requests */}
        <div className="space-y-6 lg:col-span-3">
          {/* Active requests */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-[#1A1A2E]">
                Active Requests
              </h2>
              {activeRequests.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-[#FFF9E6] px-2.5 py-0.5 text-xs font-medium text-[#F5A623]">
                  {activeRequests.length} pending
                </span>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {requestsToShow.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {requestsToShow.map((req) => (
                    <RequestCard
                      key={req.id}
                      id={req.id}
                      requesterAddress={req.requesterAddress}
                      requesterName={memberNameMap.get(req.requesterAddress)}
                      amount={req.amount}
                      description={req.description}
                      status={req.status as RequestStatus}
                      voteCount={
                        "voteCount" in req ? (req.voteCount as number) : 0
                      }
                      quorumRequired={fund.quorumRequired}
                      timeRemaining={getTimeRemaining(req.expiresAt)}
                      createdAt={req.createdAt}
                      isOwnRequest={req.requesterAddress === address}
                      onVote={(requestId) =>
                        router.push(`/fund/${fundId}/vote/${requestId}`)
                      }
                      onView={(requestId) =>
                        router.push(`/fund/${fundId}/vote/${requestId}`)
                      }
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] px-6 py-12 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                    <Check className="h-6 w-6 text-emerald-500" />
                  </div>
                  <p className="text-sm text-[#6B7280]">
                    No active requests. Everyone is safe!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Request history */}
          {pastRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="space-y-4"
            >
              <button
                onClick={() => setShowHistory((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-[#6B7280]" />
                  <h2 className="text-lg font-semibold tracking-tight text-[#1A1A2E]">
                    Request History
                  </h2>
                  <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-xs font-medium text-[#6B7280]">
                    {pastRequests.length}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#6B7280] transition-transform duration-200 ${
                    showHistory ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {pastRequests.map((req) => (
                        <RequestCard
                          key={req.id}
                          id={req.id}
                          requesterAddress={req.requesterAddress}
                          requesterName={memberNameMap.get(
                            req.requesterAddress
                          )}
                          amount={req.amount}
                          description={req.description}
                          status={req.status as RequestStatus}
                          voteCount={
                            "voteCount" in req
                              ? (req.voteCount as number)
                              : 0
                          }
                          quorumRequired={fund.quorumRequired}
                          timeRemaining={null}
                          createdAt={req.createdAt}
                          isOwnRequest={req.requesterAddress === address}
                          onView={(requestId) =>
                            router.push(`/fund/${fundId}/vote/${requestId}`)
                          }
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right: Members + Contributions */}
        <div className="space-y-6 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <MemberList
              members={members}
              pendingMembers={pendingMembers}
              organizerAddress={fund.organizerAddress}
              currentWalletAddress={address ?? undefined}
              fundId={fundId}
              onMemberApproved={() => mutate()}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ContributionHistory contributions={recentContributions} />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function FundDashboardPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = use(params);
  const { isConnected } = useWallet();

  return isConnected ? (
    <FundDashboardContent fundId={fundId} />
  ) : (
    <NotConnectedState />
  );
}
