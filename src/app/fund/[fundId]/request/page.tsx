"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  FileWarning,
} from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFundDashboard } from "@/lib/hooks/useFund";
import { useRequests } from "@/lib/hooks/useRequest";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { RequestForm } from "@/components/request/RequestForm";
import type { RequestFormData } from "@/components/request/RequestForm";
import { cn } from "@/lib/utils";
import { formatXrp } from "@/lib/utils/xrp";

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
          Connect your wallet to submit an emergency request.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function RequestSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[460px] w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

function SuccessState({
  fundId,
  fundName,
  requestId,
  amountDrops,
}: {
  fundId: string;
  fundName: string;
  requestId: string;
  amountDrops: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-lg"
    >
      <Card className="overflow-hidden border-primary/20">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-violet-400 via-primary to-blue-500" />

        <CardContent className="flex flex-col items-center gap-6 px-6 py-10">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15,
            }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
          >
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Request submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Your request for{" "}
              <span className="font-semibold text-foreground">
                {formatXrp(amountDrops)}
              </span>{" "}
              has been submitted to {fundName}. Your request is live and
              voting is now open.
            </p>
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full rounded-lg border bg-muted/30 p-4"
          >
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>
                  Members will review your request and vote. Funds are released
                  when enough members show support.
                </span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex w-full flex-col gap-3 sm:flex-row"
          >
            <Link
              href={`/fund/${fundId}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "flex-1 gap-2"
              )}
            >
              Back to fund
            </Link>
            <Link
              href={`/fund/${fundId}/vote/${requestId}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1 gap-2"
              )}
            >
              View request
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main request content
// ---------------------------------------------------------------------------

function RequestContent({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { address } = useWallet();
  const { data: dashboard, isLoading, error } = useFundDashboard(fundId);
  const { data: requests } = useRequests(fundId);

  const [success, setSuccess] = useState<{
    requestId: string;
    amount: number;
  } | null>(null);

  // Check if user already has an active request
  const hasActiveRequest = requests?.some(
    (r) =>
      r.requesterAddress === address &&
      ["submitted", "voting", "approved"].includes(r.status)
  );

  const handleSubmit = useCallback(
    async (data: RequestFormData) => {
      if (!address) throw new Error("Wallet not connected");

      const res = await fetch(`/api/fund/${fundId}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterAddress: address,
          amount: data.amount,
          description: data.description,
          documentHash: data.documentHash,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to submit request");
      }

      const result = await res.json();
      setSuccess({ requestId: result.id, amount: data.amount });
    },
    [address, fundId]
  );

  if (isLoading) return <RequestSkeleton />;

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

  const { fund, poolBalance, members } = dashboard;

  // Check membership
  const member = members.find((m) => m.walletAddress === address);
  const isMember = !!member;

  // Calculate max request amount
  const maxFromContributions = member
    ? Math.floor(member.totalContributed * fund.requestCapMultiplier)
    : 0;
  const maxFromPool = Math.floor(poolBalance * fund.maxPoolPercent);
  const maxAmount = Math.min(maxFromContributions, maxFromPool);

  // Success state
  if (success) {
    return (
      <SuccessState
        fundId={fundId}
        fundName={fund.name}
        requestId={success.requestId}
        amountDrops={success.amount}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-lg space-y-6"
    >
      {/* Header */}
      <div className="space-y-1">
        <Link
          href={`/fund/${fundId}`}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {fund.name}
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold tracking-tight"
        >
          Request Help
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground"
        >
          Describe your situation, set an amount, and provide proof.
        </motion.p>
      </div>

      {/* Not a member warning */}
      {!isMember && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              You&apos;re not a member of this fund
            </p>
            <p className="text-xs text-muted-foreground">
              Only fund members can submit emergency requests. Join the fund
              first with an invite code.
            </p>
          </div>
        </motion.div>
      )}

      {/* Already has active request warning */}
      {isMember && hasActiveRequest && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              You already have an active request
            </p>
            <p className="text-xs text-muted-foreground">
              You can only have one active request at a time. Wait for your
              current request to be resolved before submitting a new one.
            </p>
          </div>
        </motion.div>
      )}

      {/* No contributions warning */}
      {isMember && member.totalContributed === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              No contributions yet
            </p>
            <p className="text-xs text-muted-foreground">
              You need to contribute to the fund before you can request funds.
              Your maximum request is based on your total contributions.
            </p>
          </div>
        </motion.div>
      )}

      {/* Pool info */}
      {isMember && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <Badge variant="secondary" className="text-xs">
            Pool: {formatXrp(poolBalance)}
          </Badge>
          {maxAmount > 0 && (
            <Badge variant="outline" className="text-xs">
              Your max: {formatXrp(maxAmount)}
            </Badge>
          )}
        </motion.div>
      )}

      {/* Request form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RequestForm
          maxAmount={maxAmount}
          poolBalance={poolBalance}
          maxPoolPercent={fund.maxPoolPercent}
          requestCapMultiplier={fund.requestCapMultiplier}
          totalContributed={member?.totalContributed}
          onSubmit={handleSubmit}
          disabled={!isMember || !!hasActiveRequest || member?.totalContributed === 0}
        />
      </motion.div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Your request will be held securely until members vote. Funds are
          released when enough members support your request.
        </p>
        <a
          href={`https://testnet.xrpl.org/accounts/${fund.fundWalletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          View fund on ledger
        </a>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper
// ---------------------------------------------------------------------------

export default function RequestPage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = use(params);
  const { isConnected } = useWallet();

  return isConnected ? (
    <RequestContent fundId={fundId} />
  ) : (
    <NotConnectedState />
  );
}
