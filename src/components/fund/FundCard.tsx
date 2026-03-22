"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, AlertCircle, ChevronRight, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Fund } from "@/types/fund";

interface FundCardProps {
  fund: Fund & { memberCount: number; requestCount: number };
}

export function FundCard({ fund }: FundCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/fund/${fund.id}`} className="block group">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF9E6]">
                <Shield className="h-5 w-5 text-[#F5A623]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#1A1A2E] tracking-tight">
                  {fund.name}
                </h3>
                {fund.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-[#6B7280]">
                    {fund.description}
                  </p>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#6B7280] transition-transform group-hover:translate-x-0.5" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-sm text-[#6B7280]">
              <Users className="h-3.5 w-3.5" />
              <span>
                {fund.memberCount}{" "}
                {fund.memberCount === 1 ? "member" : "members"}
              </span>
            </div>

            {fund.requestCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500">
                <AlertCircle className="h-3 w-3" />
                {fund.requestCount} active
              </span>
            )}
          </div>

          {/* Footer info */}
          <div className="flex w-full items-center justify-between border-t border-gray-100 pt-3 text-xs text-[#6B7280]">
            <span>
              Votes needed: {fund.quorumRequired} / {fund.memberCount || "..."}
            </span>
            <span>
              Min: {(fund.minContribution / 1_000_000).toFixed(0)} XRP
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function FundCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-4 w-24 mb-4" />
      <div className="flex w-full justify-between border-t border-gray-100 pt-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
