"use client";

import { motion } from "framer-motion";
import { Wallet, Users, Vote, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PoolHealth } from "@/types/fund";

interface PoolStatsProps {
  poolBalance: number;
  poolHealth: PoolHealth;
  memberCount: number;
  quorumRequired: number;
  minContribution: number;
  activeRequestCount: number;
}

function formatXrp(drops: number): string {
  return (drops / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const healthConfig: Record<
  PoolHealth,
  { color: string; bg: string; label: string }
> = {
  healthy: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Healthy",
  },
  warning: {
    color: "text-[#F5A623]",
    bg: "bg-[#FFF9E6]",
    label: "Warning",
  },
  critical: {
    color: "text-red-500",
    bg: "bg-red-50",
    label: "Critical",
  },
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  delay: number;
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  delay,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <span className="text-sm text-[#6B7280]">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold text-[#1A1A2E]">{value}</p>
    </motion.div>
  );
}

export function PoolStats({
  poolBalance,
  poolHealth,
  memberCount,
  quorumRequired,
  minContribution,
  activeRequestCount,
}: PoolStatsProps) {
  const health = healthConfig[poolHealth];

  return (
    <div className="space-y-4">
      {/* Stats grid — 2x2 on mobile, 4 cols on md+ */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-5 w-5" />}
          label="Pool Balance"
          value={`${formatXrp(poolBalance)} XRP`}
          iconBg="bg-[#FFF9E6]"
          iconColor="text-[#F5A623]"
          delay={0}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Members"
          value={`${memberCount}`}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          delay={0.05}
        />
        <StatCard
          icon={<Vote className="h-5 w-5" />}
          label="Votes Needed"
          value={
            memberCount > 0 ? `${quorumRequired} / ${memberCount}` : "—"
          }
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          delay={0.1}
        />
        <StatCard
          icon={<Coins className="h-5 w-5" />}
          label="Min. Contribution"
          value={`${formatXrp(minContribution)} XRP`}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          delay={0.15}
        />
      </div>

      {/* Health badge + active requests */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${health.bg} ${health.color}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {health.label}
        </span>

        {activeRequestCount > 0 && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-600"
          >
            {activeRequestCount} active{" "}
            {activeRequestCount === 1 ? "request" : "requests"}
          </motion.span>
        )}
      </div>
    </div>
  );
}

export function PoolStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="mt-3 h-7 w-24" />
        </div>
      ))}
    </div>
  );
}
