"use client";

import { use, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  HandCoins,
  Loader2,
  CheckCircle2,
  Wallet,
  ExternalLink,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFundDashboard } from "@/lib/hooks/useFund";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { cn } from "@/lib/utils";
import { dropsToXrp, xrpToDrops, formatXrp } from "@/lib/utils/xrp";
import { buildContributionTx, canAffordContribution } from "@/lib/xrpl/payment";
import { submitTransaction } from "@/lib/wallet/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContributeStep = "input" | "signing" | "success";

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
          Connect your wallet to contribute to this fund.
        </p>
      </div>
      <ConnectWallet />
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ContributeSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-[360px] w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

function SuccessState({
  amountXrp,
  txHash,
  fundId,
  fundName,
}: {
  amountXrp: number;
  txHash: string;
  fundId: string;
  fundName: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mx-auto max-w-lg"
    >
      <Card className="overflow-hidden border-emerald-500/20">
        {/* Gradient top bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />

        <CardContent className="flex flex-col items-center gap-6 px-6 py-10">
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10"
          >
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2 text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight">
              Contribution sent!
            </h2>
            <p className="text-sm text-muted-foreground">
              You contributed{" "}
              <span className="font-semibold text-foreground">
                {amountXrp.toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP
              </span>{" "}
              to {fundName}.
            </p>
          </motion.div>

          {/* Transaction link */}
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            href={`https://testnet.xrpl.org/transactions/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View on ledger
          </motion.a>

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
              href={`/fund/${fundId}/contribute`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1 gap-2"
              )}
              onClick={(e) => {
                // Force full page reload to reset state
                e.preventDefault();
                window.location.href = `/fund/${fundId}/contribute`;
              }}
            >
              <HandCoins className="h-4 w-4" />
              Contribute again
            </Link>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main contribute form
// ---------------------------------------------------------------------------

function ContributeContent({ fundId }: { fundId: string }) {
  const router = useRouter();
  const { address } = useWallet();
  const { data: dashboard, isLoading, error } = useFundDashboard(fundId);

  const [amountXrp, setAmountXrp] = useState("");
  const [step, setStep] = useState<ContributeStep>("input");
  const [txHash, setTxHash] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [balanceInfo, setBalanceInfo] = useState<{
    availableXrp: number;
    checked: boolean;
  }>({ availableXrp: 0, checked: false });

  // Check wallet balance
  const checkBalance = useCallback(async () => {
    if (!address) return;
    setIsChecking(true);
    try {
      const { availableDrops } = await canAffordContribution(address, 0);
      setBalanceInfo({ availableXrp: dropsToXrp(availableDrops), checked: true });
    } catch {
      // Silently fail — balance check is optional UX
    } finally {
      setIsChecking(false);
    }
  }, [address]);

  // Check balance when address becomes available
  useEffect(() => {
    if (address) checkBalance();
  }, [address, checkBalance]);

  if (isLoading) return <ContributeSkeleton />;

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

  const { fund, poolBalance } = dashboard;
  const minXrp = dropsToXrp(fund.minContribution);
  const parsedAmount = parseFloat(amountXrp);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= minXrp;
  const amountDrops = isValidAmount ? xrpToDrops(parsedAmount) : 0;

  // Check if user is a member
  const isMember = dashboard.members.some(
    (m) => m.walletAddress === address
  );

  // Validation messages
  const getAmountError = (): string | null => {
    if (!amountXrp) return null;
    if (isNaN(parsedAmount) || parsedAmount <= 0) return "Enter a valid amount";
    if (parsedAmount < minXrp) return `Minimum contribution is ${minXrp} XRP`;
    if (balanceInfo.checked && parsedAmount > balanceInfo.availableXrp) {
      return "Insufficient balance";
    }
    return null;
  };

  const amountError = getAmountError();

  // Handle contribution submission
  const handleContribute = async () => {
    if (!address || !isValidAmount) return;

    setSubmitError(null);
    setStep("signing");

    try {
      // 1. Check if user can afford contribution
      const { canAfford } = await canAffordContribution(address, amountDrops);
      if (!canAfford) {
        throw new Error("Insufficient balance to cover the contribution and network fee");
      }

      // 2. Build the unsigned transaction
      const unsignedTx = await buildContributionTx({
        fromAddress: address,
        fundWalletAddress: fund.fundWalletAddress,
        amountDrops,
        fundId: fund.id,
      });

      // 3. Sign and submit via connected wallet
      const result = await submitTransaction(unsignedTx as Record<string, unknown>);

      if (!result.hash) {
        throw new Error("Transaction submitted but no hash returned");
      }

      // 4. Record the contribution in the database
      const res = await fetch(`/api/fund/${fundId}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          amount: amountDrops,
          txHash: result.hash,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record contribution");
      }

      // 5. Success!
      setTxHash(result.hash);
      setStep("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setSubmitError(message);
      setStep("input");
    }
  };

  // Preset amounts
  const presets = [
    { label: `${minXrp} XRP`, value: minXrp },
    { label: `${minXrp * 2} XRP`, value: minXrp * 2 },
    { label: `${minXrp * 5} XRP`, value: minXrp * 5 },
  ];

  // Success state
  if (step === "success") {
    return (
      <SuccessState
        amountXrp={parsedAmount}
        txHash={txHash}
        fundId={fundId}
        fundName={fund.name}
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
          Contribute
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground"
        >
          Support your community by adding to the shared pool.
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
              Only fund members can contribute. Join the fund first with an
              invite code.
            </p>
          </div>
        </motion.div>
      )}

      {/* Contribution card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <HandCoins className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Amount</CardTitle>
                  <CardDescription>
                    Min. {minXrp} XRP per contribution
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Pool: {formatXrp(poolBalance)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Amount input */}
            <div className="space-y-2">
              <Label htmlFor="amount">Contribution amount (XRP)</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder={`${minXrp}`}
                  min={minXrp}
                  step="any"
                  value={amountXrp}
                  onChange={(e) => {
                    setAmountXrp(e.target.value);
                    setSubmitError(null);
                  }}
                  disabled={step === "signing" || !isMember}
                  className={cn(
                    "pr-14 text-lg font-medium tabular-nums",
                    amountError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                  XRP
                </span>
              </div>

              {/* Amount error */}
              <AnimatePresence mode="wait">
                {amountError && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-destructive"
                  >
                    {amountError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Wallet balance */}
              {balanceInfo.checked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Available:{" "}
                  {balanceInfo.availableXrp.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}{" "}
                  XRP
                </motion.div>
              )}
            </div>

            {/* Preset amounts */}
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={
                    parsedAmount === preset.value ? "default" : "outline"
                  }
                  size="sm"
                  className="text-xs"
                  disabled={step === "signing" || !isMember}
                  onClick={() => {
                    setAmountXrp(String(preset.value));
                    setSubmitError(null);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Submit error */}
            <AnimatePresence mode="wait">
              {submitError && (
                <motion.div
                  key="submit-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-xs text-destructive">{submitError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={!isValidAmount || step === "signing" || !isMember || !!amountError}
              onClick={handleContribute}
            >
              {step === "signing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting for wallet...
                </>
              ) : (
                <>
                  <HandCoins className="h-4 w-4" />
                  Contribute{" "}
                  {isValidAmount &&
                    `${parsedAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} XRP`}
                </>
              )}
            </Button>

            {step === "signing" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-muted-foreground"
              >
                Please confirm the transaction in your wallet extension.
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Info footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 text-center"
      >
        <p className="text-xs text-muted-foreground">
          Contributions go directly to the shared fund pool.
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

export default function ContributePage({
  params,
}: {
  params: Promise<{ fundId: string }>;
}) {
  const { fundId } = use(params);
  const { isConnected } = useWallet();

  return isConnected ? (
    <ContributeContent fundId={fundId} />
  ) : (
    <NotConnectedState />
  );
}
