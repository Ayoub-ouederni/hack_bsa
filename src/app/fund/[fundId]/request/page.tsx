"use client";

import { use, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  FileWarning,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFundDashboard } from "@/lib/hooks/useFund";
import { useRequests } from "@/lib/hooks/useRequest";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { RequestForm } from "@/components/request/RequestForm";
import type { RequestFormData } from "@/components/request/RequestForm";
import { formatXrp } from "@/lib/utils/xrp";

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
          Connect your wallet to submit an emergency request.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

function RequestSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-[460px] w-full rounded-2xl" />
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
      <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#F5A623] via-emerald-400 to-[#F5A623]" />

        <div className="flex flex-col items-center gap-6 px-6 py-10">
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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-[#1A1A2E]">
              Request submitted
            </h2>
            <p className="text-sm text-[#6B7280]">
              Your request for{" "}
              <span className="font-semibold text-[#1A1A2E]">
                {formatXrp(amountDrops)}
              </span>{" "}
              has been submitted to {fundName}. Voting is now open.
            </p>
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full rounded-xl border border-gray-100 bg-[#FAFAFA] p-4"
          >
            <div className="flex items-start gap-2 text-xs text-[#6B7280]">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                Members will review your request and vote. Funds are released
                when enough members show support.
              </span>
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
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5A623] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#E09000]"
            >
              Back to fund
            </Link>
            <Link
              href={`/fund/${fundId}/vote/${requestId}`}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-[#1A1A2E] transition-colors hover:border-[#F5A623] hover:bg-[#FFF9E6]"
            >
              View request
            </Link>
          </motion.div>
        </div>
      </div>
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

  const { fund, poolBalance, members } = dashboard;

  const member = members.find((m) => m.walletAddress === address);
  const isMember = !!member;

  const maxFromContributions = member
    ? Math.floor(member.totalContributed * fund.requestCapMultiplier)
    : 0;
  const maxFromPool = Math.floor(poolBalance * fund.maxPoolPercent);
  const maxAmount = Math.min(maxFromContributions, maxFromPool);

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
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#1A1A2E]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {fund.name}
        </Link>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold tracking-tight text-[#1A1A2E]"
        >
          Request Help
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-[#6B7280]"
        >
          Describe your situation, set an amount, and provide proof.
        </motion.p>
      </div>

      {/* Warnings */}
      {!isMember && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-700">
              You&apos;re not a member of this fund
            </p>
            <p className="text-xs text-amber-600/70">
              Only fund members can submit emergency requests.
            </p>
          </div>
        </motion.div>
      )}

      {isMember && hasActiveRequest && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-700">
              You already have an active request
            </p>
            <p className="text-xs text-amber-600/70">
              Wait for your current request to be resolved first.
            </p>
          </div>
        </motion.div>
      )}

      {isMember && member.totalContributed === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-700">
              No contributions yet
            </p>
            <p className="text-xs text-amber-600/70">
              Contribute to the fund before you can request funds.
            </p>
          </div>
        </motion.div>
      )}

      {/* Pool info badges */}
      {isMember && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <span className="inline-flex items-center rounded-full bg-[#FFF9E6] px-3 py-1 text-xs font-medium text-[#F5A623]">
            Pool: {formatXrp(poolBalance)}
          </span>
          {maxAmount > 0 && (
            <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-[#6B7280]">
              Your max: {formatXrp(maxAmount)}
            </span>
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
          onBack={() => router.push(`/fund/${fundId}`)}
          disabled={
            !isMember || !!hasActiveRequest || member?.totalContributed === 0
          }
        />
      </motion.div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="text-xs text-[#6B7280]">
          Your request will be held securely until members vote. Funds are
          released when enough members support your request.
        </p>
        <a
          href={`https://testnet.xrpl.org/accounts/${fund.fundWalletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#6B7280] transition-colors hover:text-[#1A1A2E]"
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
