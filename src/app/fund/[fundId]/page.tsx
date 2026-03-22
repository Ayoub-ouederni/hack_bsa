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
import { Button, buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
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
// Skeleton for the full dashboard
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Heartbeat skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-[300px] w-[300px] rounded-full" />
      </div>

      {/* Grid skeleton */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <PoolStatsSkeleton />
          <div className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
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
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 font-mono text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {code}
        </>
      )}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Not connected state
// ---------------------------------------------------------------------------

function NotConnectedState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-24 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <AlertCircle className="h-8 w-8 text-primary/70" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Connect your wallet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Connect your wallet to view the fund dashboard and interact with the
          community.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

function FundDashboardContent({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { address } = useWallet();
  const { data: dashboard, isLoading, error, mutate } = useFundDashboard(fundId);
  const { data: allRequests } = useRequests(fundId);

  if (isLoading) return <DashboardSkeleton />;

  if (error || !dashboard) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-24 text-center"
      >
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-lg font-semibold">Fund not found</h2>
        <p className="text-sm text-muted-foreground">
          This fund may have been deleted or the link is incorrect.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </motion.div>
    );
  }

  const { fund, poolBalance, poolHealth, members, pendingMembers, activeRequests, recentContributions } =
    dashboard;

  // Build a lookup for member names by wallet address
  const memberNameMap = new Map(
    members.map((m) => [m.walletAddress, m.displayName])
  );

  // Use allRequests (from dedicated request endpoint) for richer data, fallback to dashboard activeRequests
  const requestsToShow = allRequests
    ? allRequests.filter(
        (r) =>
          r.status === "submitted" ||
          r.status === "voting" ||
          r.status === "approved"
      )
    : activeRequests;

  // Past/completed requests for history section
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

  const [showHistory, setShowHistory] = useState(false);

  // Find the first active release for HeartbeatPulse
  const activeRelease = activeRequests.find(
    (r) => r.status === "approved" || r.status === "voting"
  );

  // Last contribution for HeartbeatPulse
  const lastContrib = recentContributions[0];

  // Pool target = minContribution * memberCount (rough baseline)
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
            className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold tracking-tight md:text-3xl"
          >
            {fund.name}
          </motion.h1>
          {fund.description && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-sm text-muted-foreground"
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
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-xs text-muted-foreground"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on ledger
          </a>
        </motion.div>
      </div>

      {/* ---- HeartbeatPulse (centered) ---- */}
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
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <HandCoins className="h-4 w-4" />
          Contribute
        </Link>
        <Link
          href={`/fund/${fundId}/request`}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2"
          )}
        >
          <Plus className="h-4 w-4" />
          Request help
        </Link>
      </motion.div>

      {/* ---- Main grid ---- */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left column: Stats + Requests */}
        <div className="space-y-6 lg:col-span-3">
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

          {/* Active requests */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Active Requests
              </h2>
              {activeRequests.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeRequests.length} pending
                </Badge>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {requestsToShow.length > 0 ? (
                <div className="space-y-4">
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
                        router.push(
                          `/fund/${fundId}/vote/${requestId}`
                        )
                      }
                      onView={(requestId) =>
                        router.push(
                          `/fund/${fundId}/vote/${requestId}`
                        )
                      }
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/30 px-6 py-12 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                    <Check className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">
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
                className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-lg font-semibold tracking-tight">
                    Request History
                  </h2>
                  <Badge variant="outline" className="text-xs">
                    {pastRequests.length}
                  </Badge>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform duration-200",
                    showHistory && "rotate-180"
                  )}
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
                    <div className="space-y-4">
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
                            router.push(
                              `/fund/${fundId}/vote/${requestId}`
                            )
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

        {/* Right column: Members + Contributions */}
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
// Page wrapper (reads params, checks wallet)
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
