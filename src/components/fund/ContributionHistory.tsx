"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Contribution } from "@/types/fund";

interface ContributionWithMember extends Contribution {
  memberName: string;
}

interface ContributionHistoryProps {
  contributions: ContributionWithMember[];
}

function formatXrp(drops: number): string {
  return (drops / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(dateStr).toLocaleDateString();
}

export function ContributionHistory({ contributions }: ContributionHistoryProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-[#1A1A2E] mb-5">
        Recent Contributions
      </h3>

      <div className="space-y-0">
        {contributions.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className={index > 0 ? "mt-3 border-t border-gray-100 pt-3" : ""}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-[#1A1A2E]">
                  {c.memberName}
                </p>
                <p className="text-xs text-[#6B7280]">{timeAgo(c.createdAt)}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-emerald-500">
                  +{formatXrp(c.amount)} XRP
                </span>
                <a
                  href={`https://testnet.xrpl.org/transactions/${c.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6B7280] transition-colors hover:text-[#1A1A2E]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        ))}

        {contributions.length === 0 && (
          <p className="py-6 text-center text-sm text-[#6B7280]">
            No contributions yet. Be the first to contribute!
          </p>
        )}
      </div>
    </div>
  );
}

export function ContributionHistorySkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <Skeleton className="h-5 w-40 mb-5" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
