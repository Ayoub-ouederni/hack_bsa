"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Heart,
  Plus,
  UserPlus,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFunds } from "@/lib/hooks/useFund";
import { FundCard, FundCardSkeleton } from "@/components/fund/FundCard";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function HeroSection() {
  return (
    <div className="flex flex-col items-center gap-8 pb-16 pt-12 text-center md:pt-20 md:pb-24">
      {/* Animated pulse ring behind icon */}
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{
            scale: [1, 2.2, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20"
        >
          <Activity className="h-10 w-10 text-primary" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Community safety net,
          <br />
          <span className="text-primary">powered by trust.</span>
        </h1>
        <p className="mx-auto max-w-lg text-lg text-muted-foreground">
          Pool funds with people you trust. When someone faces an emergency, the
          group votes to release help — transparent, fair, and secure.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col items-center gap-3 sm:flex-row"
      >
        <ConnectWallet />
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="flex flex-wrap justify-center gap-3 pt-4"
      >
        {[
          { icon: Shield, label: "Group voting" },
          { icon: Heart, label: "Emergency relief" },
          { icon: Users, label: "Community-governed" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-2 text-sm text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5 text-primary/70" />
            {label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-border/60 bg-card/30 px-8 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Shield className="h-8 w-8 text-primary/70" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">No funds yet</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Start a new emergency fund for your community or join an existing one
          with an invite code.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/fund/create"
          className={cn(buttonVariants({ size: "lg" }), "gap-2")}
        >
          <Plus className="h-4 w-4" />
          Create a fund
        </Link>
        <Link
          href="/onboarding"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "gap-2"
          )}
        >
          <UserPlus className="h-4 w-4" />
          Join with invite code
        </Link>
      </div>
    </motion.div>
  );
}

function FundsList({ walletAddress }: { walletAddress: string }) {
  const { data: funds, isLoading } = useFunds(walletAddress);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Your funds</h2>
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Join
          </Link>
          <Link
            href="/fund/create"
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Link>
        </div>
      </div>

      {/* Fund cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <FundCardSkeleton key={i} />
          ))}
        </div>
      ) : !funds || funds.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {funds.map((fund) => (
            <motion.div key={fund.id} variants={item}>
              <FundCard fund={fund} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Home() {
  const { address, isConnected } = useWallet();

  return (
    <div className="flex flex-1 flex-col">
      {!isConnected ? (
        <HeroSection />
      ) : (
        <>
          {/* Compact header for connected state */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 pb-8 pt-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage your community funds
              </p>
            </div>
          </motion.div>

          <FundsList walletAddress={address!} />
        </>
      )}
    </div>
  );
}
