"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  FileText,
  Coins,
  User,
  ShieldCheck,
  ExternalLink,
  Loader2,
  PartyPopper,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFundDashboard } from "@/lib/hooks/useFund";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { VoteButtons } from "@/components/vote/VoteButtons";
import { SolidarityWall } from "@/components/animations/SolidarityWall";
import { RequestProgressTracker } from "@/components/animations/RequestProgressTracker";
import { multiSignTransaction, getSignerAddress } from "@/lib/wallet/signer";
import { cn } from "@/lib/utils";
import { dropsToXrp, formatXrp } from "@/lib/utils/xrp";
import type { Transaction } from "xrpl";

// ---------------------------------------------------------------------------
// Types — matches the actual API response from GET /request/[requestId]
// ---------------------------------------------------------------------------

interface VoteEntry {
  id: string;
  voterAddress: string;
  createdAt: string;
}

interface RequestDetailsResponse {
  id: string;
  fundId: string;
  requesterAddress: string;
  amount: number;
  description: string;
  documentHash: string;
  escrowSequence: number | null;
  escrowCondition: string | null;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  quorumRequired: number;
  signerCount: number;
  votes: VoteEntry[];
  voteCount: number;
  unsignedTx: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------

function useCountdown(expiresAt: string | null) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        setIsExpired(true);
        return;
      }

      setIsExpired(false);
      const minutes = Math.floor(diff / 60_000);
      const seconds = Math.floor((diff % 60_000) / 1_000);

      if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds.toString().padStart(2, "0")}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return { timeLeft, isExpired };
}

// ---------------------------------------------------------------------------
// SWR fetcher for request details (inline to avoid type mismatch with hook)
// ---------------------------------------------------------------------------

function useRequestData(fundId: string, requestId: string) {
  const [data, setData] = useState<RequestDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/fund/${fundId}/request/${requestId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to fetch request");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  }, [fundId, requestId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ---------------------------------------------------------------------------
// Truncate address helper
// ---------------------------------------------------------------------------

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9E6]">
        <ShieldCheck className="h-8 w-8 text-[#F5A623]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Connect your wallet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Connect your wallet to view and vote on this request.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function VoteSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-[80px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[120px] w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    submitted: { variant: "secondary", label: "Submitted" },
    voting: { variant: "default", label: "Voting" },
    approved: { variant: "outline", label: "Approved" },
    released: { variant: "default", label: "Released" },
    expired: { variant: "destructive", label: "Expired" },
    cancelled: { variant: "destructive", label: "Cancelled" },
  };

  const { variant, label } = config[status] ?? { variant: "secondary" as const, label: status };

  return <Badge variant={variant}>{label}</Badge>;
}

// ---------------------------------------------------------------------------
// Quorum reached celebration
// ---------------------------------------------------------------------------

function QuorumCelebration({ released }: { released: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-8"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
      >
        <PartyPopper className="h-12 w-12 text-emerald-500" />
      </motion.div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-emerald-500">
          {released ? "Funds released!" : "Enough votes collected!"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {released
            ? "The community showed solidarity — funds have been released to the requester."
            : "The community showed solidarity — funds are being released."}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Expired state
// ---------------------------------------------------------------------------

function ExpiredNotice() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-red-500">
          This request has expired
        </p>
        <p className="text-xs text-muted-foreground">
          The voting period ended before enough votes were collected. The held
          funds have been returned to the pool.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main vote content
// ---------------------------------------------------------------------------

function VoteContent({
  fundId,
  requestId,
}: {
  fundId: string;
  requestId: string;
}) {
  const router = useRouter();
  const { address } = useWallet();
  const { data: dashboard } = useFundDashboard(fundId);
  const {
    data: request,
    isLoading,
    error,
    refetch,
  } = useRequestData(fundId, requestId);

  const { timeLeft, isExpired: countdownExpired } = useCountdown(
    request?.expiresAt ?? null
  );

  // Derive member name lookup from dashboard
  const memberNames = useMemo(() => {
    if (!dashboard) return new Map<string, string>();
    const map = new Map<string, string>();
    for (const m of dashboard.members) {
      map.set(m.walletAddress, m.displayName);
    }
    return map;
  }, [dashboard]);

  // Derived state
  const isOwnRequest = request?.requesterAddress === address;
  const hasVoted = request?.votes.some((v) => v.voterAddress === address) ?? false;
  const quorumReached =
    request !== null &&
    request !== undefined &&
    request.voteCount >= request.quorumRequired;
  const isVotingOpen = request?.status === "voting" && !countdownExpired;
  const isReleased = request?.status === "released";
  const isExpired = request?.status === "expired" || countdownExpired;
  const isApproved = request?.status === "approved";

  // Voter names for SolidarityWall
  const voterNames = useMemo(() => {
    if (!request) return [];
    return request.votes.map(
      (v) => memberNames.get(v.voterAddress) ?? truncateAddress(v.voterAddress)
    );
  }, [request, memberNames]);

  // Member check
  const isMember = dashboard?.members.some(
    (m) => m.walletAddress === address
  );

  // Check if signer keypair exists locally (needed to actually vote)
  const hasSignerKey = Boolean(getSignerAddress(fundId));

  // Handle vote
  const handleVote = useCallback(async () => {
    if (!request?.unsignedTx || !address) {
      throw new Error("Unable to sign — request data not available");
    }

    // 1. Multi-sign the unsigned EscrowFinish TX with local signer key
    const signedTxBlob = multiSignTransaction(
      fundId,
      request.unsignedTx as unknown as Transaction
    );

    // 2. Get signer address from localStorage keypair
    const signerAddress = getSignerAddress(fundId);

    if (!signerAddress) {
      throw new Error("No signer key found for this fund. Join the fund first.");
    }

    // 3. POST to vote API
    const res = await fetch(
      `/api/fund/${fundId}/request/${requestId}/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterAddress: address,
          signerAddress,
          signedTxBlob,
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to cast vote");
    }

    // 4. Refetch data to update UI
    await refetch();
  }, [request, address, fundId, requestId, refetch]);

  // Loading
  if (isLoading) return <VoteSkeleton />;

  // Error or not found
  if (error || !request) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-4 py-24 text-center"
      >
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h2 className="text-lg font-semibold">Request not found</h2>
        <p className="text-sm text-muted-foreground">
          {error || "This request may have been deleted or the link is incorrect."}
        </p>
        <Link
          href={`/fund/${fundId}`}
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fund
        </Link>
      </motion.div>
    );
  }

  const requesterName =
    memberNames.get(request.requesterAddress) ??
    truncateAddress(request.requesterAddress);

  const totalMembers = dashboard?.members.length ?? request.signerCount;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/fund/${fundId}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {dashboard?.fund.name ?? "fund"}
        </Link>
        <div className="flex items-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-bold tracking-tight"
          >
            Emergency request
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <StatusBadge status={request.status} />
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground"
        >
          Submitted by {requesterName}
        </motion.p>
      </div>

      {/* Progress tracker */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RequestProgressTracker
          status={request.status as "submitted" | "voting" | "approved" | "released" | "expired"}
          currentVotes={request.voteCount}
          quorumRequired={request.quorumRequired}
          timeRemaining={timeLeft ?? undefined}
        />
      </motion.div>

      {/* Request details card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9E6]">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {formatXrp(request.amount)} requested
                  </CardTitle>
                  <CardDescription>
                    by {requesterName}
                  </CardDescription>
                </div>
              </div>

              {/* Countdown */}
              {timeLeft && request.status === "voting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums",
                    countdownExpired
                      ? "bg-destructive/10 text-red-500"
                      : "bg-[#FFF9E6] text-primary"
                  )}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {timeLeft}
                </motion.div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                Description
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">
                {request.description}
              </p>
            </div>

            <Separator />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Requester */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  Requester
                </div>
                <p className="text-sm font-medium">
                  {requesterName}
                  {isOwnRequest && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Coins className="h-3.5 w-3.5" />
                  Amount
                </div>
                <p className="text-sm font-medium">
                  {dropsToXrp(request.amount).toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  XRP
                </p>
              </div>

              {/* Document hash */}
              {request.documentHash && (
                <div className="col-span-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    Document fingerprint
                  </div>
                  <p className="break-all font-mono text-xs text-muted-foreground">
                    {request.documentHash}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Solidarity Wall */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Community support</CardTitle>
            <CardDescription>
              {request.voteCount} of {request.quorumRequired} votes
              collected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SolidarityWall
              currentVotes={request.voteCount}
              quorumRequired={request.quorumRequired}
              totalMembers={totalMembers}
              voterNames={voterNames}
              quorumReached={quorumReached}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Quorum celebration */}
      <AnimatePresence>
        {(quorumReached || isReleased) && (
          <QuorumCelebration released={isReleased} />
        )}
      </AnimatePresence>

      {/* Expired notice */}
      <AnimatePresence>
        {isExpired && request.status !== "released" && <ExpiredNotice />}
      </AnimatePresence>

      {/* Vote section */}
      {isVotingOpen && isMember && hasSignerKey && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cast your vote</CardTitle>
              <CardDescription>
                Vote to show your support for this request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VoteButtons
                onSupport={handleVote}
                onPass={() => router.push(`/fund/${fundId}`)}
                disabled={!request.unsignedTx || countdownExpired}
                hasVoted={hasVoted}
                isOwnRequest={isOwnRequest}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Member but missing local signer key */}
      {isMember && !hasSignerKey && request.status === "voting" && !quorumReached && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-700">
              Signer key not found on this device
            </p>
            <p className="text-xs text-muted-foreground">
              You are a member of this fund, but your signing key is missing from this browser. Try rejoining the fund or use the browser where you originally joined.
            </p>
          </div>
        </motion.div>
      )}

      {/* Not a member warning */}
      {!isMember && request.status === "voting" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600 text-amber-700">
              You&apos;re not a member of this fund
            </p>
            <p className="text-xs text-muted-foreground">
              Only fund members can vote on requests.
            </p>
          </div>
        </motion.div>
      )}

      {/* Approved but not released — retry */}
      {isApproved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-6"
        >
          <AlertCircle className="h-8 w-8 text-amber-600" />
          <div className="text-center">
            <p className="text-sm font-medium text-amber-600">
              Votes collected but release failed
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              The transaction may need to be retried.
            </p>
          </div>
          <RetryReleaseButton fundId={fundId} requestId={requestId} onSuccess={refetch} />
        </motion.div>
      )}

      {/* View on ledger */}
      {request.escrowSequence !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <a
            href={`https://testnet.xrpl.org/accounts/${dashboard?.fund.fundWalletAddress ?? ""}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            View on ledger
          </a>
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Retry release button
// ---------------------------------------------------------------------------

function RetryReleaseButton({
  fundId,
  requestId,
  onSuccess,
}: {
  fundId: string;
  requestId: string;
  onSuccess: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);
    try {
      const res = await fetch(
        `/api/fund/${fundId}/request/${requestId}/retry-release`,
        { method: "POST" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Retry failed");
      }
      onSuccess();
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRetry}
        disabled={isRetrying}
        className="gap-2"
      >
        {isRetrying ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Retrying...
          </>
        ) : (
          "Retry release"
        )}
      </Button>
      {retryError && (
        <p className="text-xs text-red-500">{retryError}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function VotePage({
  params,
}: {
  params: Promise<{ fundId: string; requestId: string }>;
}) {
  const { fundId, requestId } = use(params);
  const { isConnected } = useWallet();

  return isConnected ? (
    <VoteContent fundId={fundId} requestId={requestId} />
  ) : (
    <NotConnectedState />
  );
}
