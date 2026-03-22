"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Heart,
  Plus,
  Shield,
  Users,
  UserPlus,
  Vote,
  Wallet,
  Zap,
  HandCoins,
} from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/lib/hooks/useWallet";
import { useFunds } from "@/lib/hooks/useFund";
import { FundCard, FundCardSkeleton } from "@/components/fund/FundCard";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

/* ── Animation variants ── */
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

/* ── Features data ── */
const features = [
  {
    icon: Shield,
    title: "Multi-Signature Security",
    description:
      "Every disbursement requires group consensus through XRPL multi-sign. No single person controls the funds.",
  },
  {
    icon: Vote,
    title: "Democratic Voting",
    description:
      "Members vote on emergency requests transparently. Funds are released only when the quorum is reached.",
  },
  {
    icon: Heart,
    title: "Social Impact",
    description:
      "Built for communities who trust each other. Help your neighbors, colleagues, or friends when they need it most.",
  },
];

/* ── How it works steps ── */
const steps = [
  {
    icon: Wallet,
    title: "Connect & Create",
    description:
      "Connect your GemWallet and create a community fund or join one with an invite code.",
  },
  {
    icon: HandCoins,
    title: "Pool Funds",
    description:
      "Members contribute XRP to a shared escrow pool. Contributions are transparent and tracked on-chain.",
  },
  {
    icon: Zap,
    title: "Request & Vote",
    description:
      "When someone faces an emergency, they submit a request. Members vote, and funds are released automatically.",
  },
];

/* ── Stats data ── */
const stats = [
  { value: "100%", label: "On-Chain", description: "Fully transparent" },
  { value: "0", label: "Middlemen", description: "Direct peer-to-peer" },
  { value: "< 5s", label: "Settlement", description: "XRPL speed" },
];

/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid pattern (Finwise-inspired) */}
      <div className="absolute inset-0 -z-10 bg-[#FAFAFA] bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 md:pt-24 md:pb-28">
        <div className="flex flex-col items-center text-center">
          {/* Animated pulse ring behind icon */}
          <div className="relative mb-8">
            <motion.div
              className="absolute inset-0 rounded-full bg-[#F5A623]/20"
              animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-[#F5A623]/10"
              animate={{ scale: [1, 2.4, 1], opacity: [0.3, 0, 0.3] }}
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
              className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#FFF9E6] ring-1 ring-[#F5A623]/20"
            >
              <Activity className="h-10 w-10 text-[#F5A623]" />
            </motion.div>
          </div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-[#1A1A2E] md:text-6xl md:leading-tight max-w-3xl"
          >
            Community Emergency Fund
            <br />
            <span className="text-[#F5A623]">on XRPL</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-6 max-w-xl text-lg text-[#6B7280]"
          >
            Pool funds with people you trust. When someone faces an emergency,
            the group votes to release help — transparent, fair, and powered by
            the XRP Ledger.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <ConnectWallet />
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-[#1A1A2E] transition-all hover:border-[#F5A623] hover:bg-[#FFF9E6] hover:text-[#F5A623]"
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {[
              { icon: Shield, label: "Group voting" },
              { icon: Heart, label: "Emergency relief" },
              { icon: Users, label: "Community-governed" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-[#6B7280] shadow-sm"
              >
                <Icon className="h-3.5 w-3.5 text-[#F5A623]" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            Built for <span className="text-[#F5A623]">Trust</span>
          </h2>
          <p className="mt-4 text-[#6B7280] max-w-lg mx-auto">
            Pulse leverages XRPL multi-signature technology to create a
            transparent and secure community safety net.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-6 md:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              whileHover={{ y: -4, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-shadow"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF9E6]">
                <feature.icon className="h-6 w-6 text-[#F5A623]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1A1A2E]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS SECTION
   ═══════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-14"
        >
          <h2 className="text-3xl font-bold text-[#1A1A2E] md:text-4xl">
            How It <span className="text-[#F5A623]">Works</span>
          </h2>
          <p className="mt-4 text-[#6B7280] max-w-lg mx-auto">
            Three simple steps to protect your community.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5A623] text-white shadow-lg shadow-[#F5A623]/25">
                <span className="text-xl font-bold">{index + 1}</span>
              </div>

              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="absolute top-7 left-[calc(50%+2rem)] hidden w-[calc(100%-4rem)] border-t-2 border-dashed border-[#F5A623]/30 md:block" />
              )}

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF9E6] mb-4">
                <step.icon className="h-6 w-6 text-[#F5A623]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A2E]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[#6B7280] max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   STATS SECTION
   ═══════════════════════════════════════════ */
function StatsSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 gap-8 sm:grid-cols-3"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="text-center"
            >
              <p className="text-4xl font-bold text-[#F5A623]">{stat.value}</p>
              <p className="mt-1 text-lg font-semibold text-[#1A1A2E]">
                {stat.label}
              </p>
              <p className="mt-1 text-sm text-[#6B7280]">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CTA SECTION (Finwise-inspired dark block)
   ═══════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="py-10 mb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#1A1A2E] px-8 py-16 text-center md:py-20">
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 -z-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_400px,#F5A62315,transparent)]" />

          <div className="relative z-10">
            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-3xl font-bold text-white md:text-5xl md:leading-tight max-w-2xl mx-auto"
            >
              Ready to protect your{" "}
              <span className="text-[#F5A623]">community</span>?
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-4 text-gray-400 max-w-lg mx-auto"
            >
              Connect your wallet and start building a safety net with the
              people you trust.
            </motion.p>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            >
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-8 py-3 font-medium text-white transition-colors hover:bg-[#E09000]"
              >
                <UserPlus className="h-5 w-5" />
                Join a Fund
              </Link>
              <Link
                href="/fund/create"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3 font-medium text-white transition-colors hover:bg-white/10"
              >
                <Plus className="h-5 w-5" />
                Create a Fund
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   CONNECTED STATE — EMPTY / FUNDS LIST
   ═══════════════════════════════════════════ */
function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] px-8 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF9E6]">
        <Shield className="h-8 w-8 text-[#F5A623]" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-[#1A1A2E]">No funds yet</h2>
        <p className="max-w-sm text-sm text-[#6B7280]">
          Start a new emergency fund for your community or join an existing one
          with an invite code.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/fund/create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] px-6 py-3 font-medium text-white transition-colors hover:bg-[#E09000]"
        >
          <Plus className="h-4 w-4" />
          Create a fund
        </Link>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-[#1A1A2E] transition-colors hover:border-[#F5A623] hover:bg-[#FFF9E6]"
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
        <h2 className="text-xl font-semibold tracking-tight text-[#1A1A2E]">
          Your funds
        </h2>
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Join
          </Link>
          <Link
            href="/fund/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F5A623] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#E09000]"
          >
            <Plus className="h-3.5 w-3.5" />
            Create
          </Link>
        </div>
      </div>

      {/* Fund cards */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
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

/* ═══════════════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════════════ */
export default function Home() {
  const { address, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div className="flex flex-1 flex-col">
        {/* Compact welcome header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 pb-8 pt-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9E6]">
            <Activity className="h-5 w-5 text-[#F5A623]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[#1A1A2E]">
              Welcome back
            </h1>
            <p className="text-sm text-[#6B7280]">
              Manage your community funds
            </p>
          </div>
        </motion.div>

        <FundsList walletAddress={address!} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col -mx-6 -mt-8">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CTASection />
    </div>
  );
}
