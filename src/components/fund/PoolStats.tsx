"use client";

import { motion } from "framer-motion";
import { Wallet, Users, Vote, Coins } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const healthConfig: Record<PoolHealth, { color: string; label: string; badgeVariant: "default" | "secondary" | "destructive" }> = {
  healthy: { color: "text-emerald-400", label: "Healthy", badgeVariant: "default" },
  warning: { color: "text-amber-400", label: "Warning", badgeVariant: "secondary" },
  critical: { color: "text-red-400", label: "Critical", badgeVariant: "destructive" },
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
  delay: number;
}

function StatItem({ icon, label, value, accent, delay }: StatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.25 }}
      className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-3"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-semibold ${accent ?? "text-foreground"}`}>
          {value}
        </p>
      </div>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fund Overview</CardTitle>
          <Badge variant={health.badgeVariant}>{health.label}</Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            icon={<Wallet className="h-4 w-4" />}
            label="Shared Pool"
            value={`${formatXrp(poolBalance)} XRP`}
            accent={health.color}
            delay={0}
          />
          <StatItem
            icon={<Users className="h-4 w-4" />}
            label="Members"
            value={`${memberCount}`}
            delay={0.05}
          />
          <StatItem
            icon={<Vote className="h-4 w-4" />}
            label="Votes Needed"
            value={`${quorumRequired} / ${memberCount}`}
            delay={0.1}
          />
          <StatItem
            icon={<Coins className="h-4 w-4" />}
            label="Min. Contribution"
            value={`${formatXrp(minContribution)} XRP`}
            delay={0.15}
          />
        </div>

        {activeRequestCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-center text-xs text-amber-400"
          >
            {activeRequestCount} active{" "}
            {activeRequestCount === 1 ? "request" : "requests"} pending
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export function PoolStatsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fund Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-3">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
