"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Coins,
  Heart,
  Home,
  Utensils,
  CloudLightning,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RequestStatus } from "@/types/request";

export interface RequestCardProps {
  id: string;
  requesterAddress: string;
  requesterName?: string;
  amount: number;
  description: string;
  status: RequestStatus;
  voteCount: number;
  quorumRequired: number;
  timeRemaining?: string | null;
  createdAt: string;
  onVote?: (requestId: string) => void;
  onView?: (requestId: string) => void;
  isOwnRequest?: boolean;
}

function dropsToXRP(drops: number): string {
  return (drops / 1_000_000).toFixed(6).replace(/\.?0+$/, "");
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/* ── Category detection from description keywords ── */
const CATEGORIES = [
  { keywords: ["medical", "hospital", "doctor", "health", "surgery", "medicine", "clinic"], label: "Medical", icon: Stethoscope, color: "text-rose-500", bg: "bg-rose-50" },
  { keywords: ["rent", "housing", "eviction", "home", "apartment", "shelter"], label: "Housing", icon: Home, color: "text-blue-500", bg: "bg-blue-50" },
  { keywords: ["food", "groceries", "hunger", "meal", "eat"], label: "Food", icon: Utensils, color: "text-orange-500", bg: "bg-orange-50" },
  { keywords: ["disaster", "flood", "fire", "earthquake", "storm", "hurricane"], label: "Disaster", icon: CloudLightning, color: "text-purple-500", bg: "bg-purple-50" },
] as const;

function detectCategory(description: string) {
  const lower = description.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return { label: "Emergency", icon: Heart, color: "text-[#F5A623]", bg: "bg-[#FFF9E6]" };
}

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  submitted: { label: "Submitted", bg: "bg-[#F3F4F6]", text: "text-[#6B7280]", icon: Clock },
  voting: { label: "Voting", bg: "bg-[#FFF9E6]", text: "text-[#F5A623]", icon: Users },
  approved: { label: "Approved", bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  released: { label: "Released", bg: "bg-emerald-50", text: "text-emerald-600", icon: CheckCircle2 },
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-500", icon: XCircle },
  cancelled: { label: "Cancelled", bg: "bg-red-50", text: "text-red-500", icon: XCircle },
};

export function RequestCard({
  id,
  requesterAddress,
  requesterName,
  amount,
  description,
  status,
  voteCount,
  quorumRequired,
  timeRemaining,
  createdAt,
  onVote,
  onView,
  isOwnRequest = false,
}: RequestCardProps) {
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const voteProgress =
    quorumRequired > 0 ? Math.min((voteCount / quorumRequired) * 100, 100) : 0;
  const isVotable = status === "voting" && !isOwnRequest && onVote;
  const isActive = status === "voting" || status === "submitted";
  const category = detectCategory(description);
  const CategoryIcon = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition-all ${
        isActive ? "border-[#F5A623]/20" : "border-gray-100"
      }`}
    >
      {/* ── Category header area (FundVerse style) ── */}
      <div className={`${category.bg} px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <CategoryIcon className={`h-5 w-5 ${category.color}`} />
          <span className={`text-xs font-semibold uppercase tracking-wide ${category.color}`}>
            {category.label}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}
        >
          <StatusIcon className="h-3 w-3" />
          {config.label}
        </span>
      </div>

      {/* ── Card body ── */}
      <div className="p-6">
        {/* Amount */}
        <div className="flex items-center gap-2 mb-2">
          <Coins className="h-5 w-5 shrink-0 text-[#F5A623]" />
          <span className="text-xl font-bold text-[#1A1A2E] font-mono">
            {dropsToXRP(amount)} XRP
          </span>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-[#6B7280] mb-4 leading-relaxed">
          {description}
        </p>

        {/* Vote progress bar */}
        {(status === "voting" || status === "submitted") && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#6B7280]">Votes</span>
              <span className="font-semibold text-[#1A1A2E]">
                {voteCount} / {quorumRequired}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-[#F5A623]"
                initial={{ width: 0 }}
                animate={{ width: `${voteProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Time remaining */}
        {timeRemaining && status === "voting" && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-4">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>{timeRemaining} remaining</span>
          </div>
        )}

        {/* Requester + date footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF9E6] text-xs font-medium text-[#F5A623]">
              {(requesterName || requesterAddress)[0].toUpperCase()}
            </div>
            <span className="text-xs text-[#6B7280]">
              {requesterName || truncateAddress(requesterAddress)}
              {isOwnRequest && (
                <span className="ml-1 text-[#F5A623]">(you)</span>
              )}
            </span>
          </div>
          <span className="text-xs text-[#6B7280]">
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Actions */}
        {(isVotable || onView) && (
          <div className="flex gap-2 mt-4">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-[#6B7280] hover:text-[#1A1A2E] hover:bg-gray-50 rounded-xl"
                onClick={() => onView(id)}
              >
                View details
              </Button>
            )}
            {isVotable && (
              <Button
                size="sm"
                className="flex-1 bg-[#F5A623] hover:bg-[#E09000] text-white rounded-xl gap-1"
                onClick={() => onVote(id)}
              >
                Support
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
