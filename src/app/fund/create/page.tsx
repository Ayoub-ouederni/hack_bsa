"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Plus,
  Shield,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FUND_RULES } from "@/lib/utils/validation";
import { useWallet } from "@/lib/hooks/useWallet";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { xrpToDrops } from "@/lib/utils/xrp";

interface CreatedFund {
  id: string;
  name: string;
  fundWalletAddress: string;
  inviteCode: string;
}

export default function CreateFundPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minContributionXrp, setMinContributionXrp] = useState(10);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdFund, setCreatedFund] = useState<CreatedFund | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          organizerAddress: address,
          minContribution: xrpToDrops(minContributionXrp),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create fund");
      }

      const fund = await res.json();
      setCreatedFund(fund);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = async () => {
    if (!createdFund) return;
    await navigator.clipboard.writeText(createdFund.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"
        >
          <Shield className="h-10 w-10 text-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <h1 className="text-2xl font-bold">Connect your wallet</h1>
          <p className="text-muted-foreground">
            You need a connected wallet to create a fund.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <ConnectWallet />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center gap-3"
      >
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Create a fund
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up a new community emergency fund
          </p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {createdFund ? (
          /* ─── Success State ─── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Success icon */}
            <div className="flex flex-col items-center gap-4 pt-4 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                  delay: 0.15,
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30"
              >
                <Check className="h-8 w-8 text-green-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <h2 className="text-xl font-semibold">Fund created</h2>
                <p className="text-sm text-muted-foreground">
                  Share the invite code with your community members
                </p>
              </motion.div>
            </div>

            {/* Invite code card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col items-center gap-4 py-8">
                  <p className="text-sm font-medium text-muted-foreground">
                    Invite code
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-3xl font-bold tracking-[0.2em]">
                      {createdFund.inviteCode}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyInviteCode}
                      className="h-10 w-10 shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <AnimatePresence>
                    {copied && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-green-500"
                      >
                        Copied to clipboard
                      </motion.p>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Fund details summary */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardContent className="space-y-3 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fund name</span>
                    <span className="font-medium">{createdFund.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fund account</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {createdFund.fundWalletAddress.slice(0, 8)}...
                      {createdFund.fundWalletAddress.slice(-6)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                className="flex-1 gap-2"
                onClick={() => router.push(`/fund/${createdFund.id}`)}
              >
                Open fund dashboard
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => router.push("/")}
              >
                Back to home
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          /* ─── Form ─── */
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Fund basics */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center gap-2 pb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Fund details
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Fund name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Neighborhood Safety Net"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="What is this fund for? Who can join?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  {description.length > 0 && (
                    <p className="text-xs text-muted-foreground text-right">
                      {description.length}/500
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contribution */}
            <Card>
              <CardContent className="space-y-5 pt-6">
                <div className="flex items-center gap-2 pb-1">
                  <Coins className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Contribution
                  </h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minContribution">
                    Minimum contribution
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="minContribution"
                      type="number"
                      min={1}
                      step="any"
                      value={minContributionXrp}
                      onChange={(e) =>
                        setMinContributionXrp(parseFloat(e.target.value) || 1)
                      }
                      className="w-32"
                      required
                    />
                    <Badge variant="secondary" className="shrink-0">
                      <Coins className="mr-1 h-3 w-3" />
                      XRP
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The minimum amount each member must contribute per payment.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Hardcoded rules info */}
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="space-y-3 py-5">
                <div className="flex items-center gap-2 pb-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Fund rules
                  </h2>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">50% approval required</strong> — at least half of members must vote to approve a fund request
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Up to {FUND_RULES.requestCapMultiplier}x your contributions</strong> — members can request up to {FUND_RULES.requestCapMultiplier} times what they have contributed
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>
                      <strong className="text-foreground">Max {FUND_RULES.maxPoolPercent * 100}% of the pool</strong> — a single request cannot exceed {FUND_RULES.maxPoolPercent * 100}% of the total pool
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gap-2"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating your fund...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create fund
                </>
              )}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
