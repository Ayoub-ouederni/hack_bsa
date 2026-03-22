"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ticket,
  User,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWallet } from "@/lib/hooks/useWallet";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { generateSignerKeypair } from "@/lib/wallet/signer";
import { toast } from "sonner";

type Step = "invite" | "name" | "wallet" | "joining" | "success";

interface FundInfo {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  quorumRequired: number;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
};

const STEPS: { key: Step; label: string; icon: typeof Ticket }[] = [
  { key: "invite", label: "Invite code", icon: Ticket },
  { key: "name", label: "Your name", icon: User },
  { key: "wallet", label: "Connect", icon: Wallet },
  { key: "success", label: "Done", icon: CheckCircle2 },
];

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: isActive ? 1 : 0.85,
                opacity: isActive || isDone ? 1 : 0.4,
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                isDone
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary/20 text-primary ring-2 ring-primary/40"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
            </motion.div>
            {i < STEPS.length - 1 && (
              <div
                className={`hidden h-px w-8 sm:block ${
                  isDone ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useWallet();

  const [step, setStep] = useState<Step>("invite");
  const [direction, setDirection] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [fundInfo, setFundInfo] = useState<FundInfo | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinedFundId, setJoinedFundId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const goTo = (next: Step) => {
    const currentIndex = STEPS.findIndex((s) => s.key === step);
    const nextIndex = STEPS.findIndex((s) => s.key === next);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setError("");
    setStep(next);
  };

  const handleLookupInvite = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code.");
      return;
    }

    setIsLookingUp(true);
    setError("");

    try {
      const res = await fetch(
        `/api/fund?invite=${encodeURIComponent(inviteCode.trim().toUpperCase())}`
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid invite code.");
        return;
      }

      const fund = await res.json();
      setFundInfo({
        id: fund.id,
        name: fund.name,
        description: fund.description,
        memberCount: fund.memberCount,
        quorumRequired: fund.quorumRequired,
      });
      goTo("name");
    } catch {
      setError("Failed to look up invite code. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleNameSubmit = () => {
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (isConnected) {
      handleJoin();
    } else {
      goTo("wallet");
    }
  };

  const handleJoin = async () => {
    if (!fundInfo || !address) return;

    setIsJoining(true);
    setError("");
    goTo("joining");

    try {
      const signer = generateSignerKeypair(fundInfo.id);

      const res = await fetch(`/api/fund/${fundInfo.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
          walletAddress: address,
          signerAddress: signer.address,
          displayName: displayName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to join fund.");
        goTo("name");
        return;
      }

      setJoinedFundId(fundInfo.id);
      toast.success(`Request sent to join ${fundInfo.name}!`);
      goTo("success");
    } catch {
      setError("Something went wrong. Please try again.");
      goTo("name");
    } finally {
      setIsJoining(false);
    }
  };

  // Auto-trigger join when wallet connects on the wallet step
  const handleWalletStepContinue = () => {
    if (isConnected && address) {
      handleJoin();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Step indicator */}
        <StepIndicator currentStep={step === "joining" ? "wallet" : step} />

        {/* Step content */}
        <AnimatePresence mode="wait" custom={direction}>
          {step === "invite" && (
            <motion.div
              key="invite"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Join a fund</CardTitle>
                  <CardDescription>
                    Enter the invite code shared by your community organizer.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">Invite code</Label>
                    <Input
                      id="invite-code"
                      placeholder="e.g. AB3KX7YZ"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value.toUpperCase());
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleLookupInvite()
                      }
                      className="text-center font-mono text-lg tracking-widest"
                      maxLength={20}
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>
                  <Button
                    onClick={handleLookupInvite}
                    disabled={isLookingUp || !inviteCode.trim()}
                    className="w-full gap-2"
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {isLookingUp ? "Looking up..." : "Continue"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "name" && fundInfo && (
            <motion.div
              key="name"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Almost there</CardTitle>
                  <CardDescription>
                    You&apos;re joining{" "}
                    <span className="font-medium text-foreground">
                      {fundInfo.name}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Fund preview */}
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fundInfo.name}
                        </p>
                        {fundInfo.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {fundInfo.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {fundInfo.memberCount}{" "}
                        {fundInfo.memberCount === 1 ? "member" : "members"}
                      </span>
                      <span>Votes needed: {fundInfo.quorumRequired}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display-name">Your display name</Label>
                    <Input
                      id="display-name"
                      placeholder="How others will see you"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setError("");
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleNameSubmit()
                      }
                      maxLength={50}
                      autoFocus
                    />
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-destructive"
                      >
                        {error}
                      </motion.p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => goTo("invite")}
                      className="gap-1.5"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNameSubmit}
                      disabled={!displayName.trim()}
                      className="flex-1 gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {isConnected ? "Join fund" : "Continue"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "wallet" && (
            <motion.div
              key="wallet"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Connect your wallet</CardTitle>
                  <CardDescription>
                    Connect your wallet to finalize joining the fund.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center">
                    <ConnectWallet />
                  </div>

                  {isConnected && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Button
                        onClick={handleWalletStepContinue}
                        className="w-full gap-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Join fund
                      </Button>
                    </motion.div>
                  )}

                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => goTo("name")}
                      className="gap-1.5 text-muted-foreground"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "joining" && (
            <motion.div
              key="joining"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="h-8 w-8 text-primary" />
                  </motion.div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Joining fund...</p>
                    <p className="text-sm text-muted-foreground">
                      Setting up your membership
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "success" && fundInfo && (
            <motion.div
              key="success"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Card>
                <CardContent className="flex flex-col items-center gap-6 py-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.1,
                    }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15"
                  >
                    <Clock className="h-8 w-8 text-amber-500" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-2"
                  >
                    <h2 className="text-xl font-semibold">
                      Request sent!
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Your request to join{" "}
                      <span className="font-medium text-foreground">
                        {fundInfo.name}
                      </span>{" "}
                      has been submitted. The fund organizer will review and
                      approve your membership.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col gap-2 w-full"
                  >
                    <Button
                      onClick={() =>
                        router.push(`/fund/${joinedFundId}`)
                      }
                      className="w-full gap-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Go to fund dashboard
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => router.push("/")}
                      className="w-full text-muted-foreground"
                    >
                      Back to home
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
