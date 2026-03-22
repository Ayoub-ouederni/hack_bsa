"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Clock, Check, Loader2, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { Member, PendingMember } from "@/types/fund";

interface MemberListProps {
  members: Member[];
  pendingMembers?: PendingMember[];
  organizerAddress: string;
  currentWalletAddress?: string;
  fundId: string;
  onMemberApproved?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatXrp(drops: number): string {
  return (drops / 1_000_000).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function PendingMemberRow({
  member,
  isOrganizer,
  fundId,
  organizerWallet,
  onApproved,
}: {
  member: PendingMember;
  isOrganizer: boolean;
  fundId: string;
  organizerWallet: string;
  onApproved?: () => void;
}) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(
        `/api/fund/${fundId}/members/${member.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-wallet-address": organizerWallet,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to approve member");
        return;
      }

      toast.success(`${member.displayName} approved!`);
      onApproved?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar size="default">
        <AvatarFallback className="bg-amber-50 text-[#F5A623] text-xs font-medium">
          {getInitials(member.displayName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <span className="truncate text-sm font-medium text-[#1A1A2E]">
          {member.displayName}
        </span>
        <p className="flex items-center gap-1 text-xs text-[#6B7280]">
          <Clock className="h-3 w-3" />
          Waiting for approval
        </p>
      </div>

      {isOrganizer ? (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl"
          onClick={handleApprove}
          disabled={isApproving}
        >
          {isApproving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {isApproving ? "Approving..." : "Approve"}
        </Button>
      ) : (
        <Badge className="shrink-0 bg-amber-50 text-[#F5A623] border-amber-200">
          Pending
        </Badge>
      )}
    </div>
  );
}

export function MemberList({
  members,
  pendingMembers = [],
  organizerAddress,
  currentWalletAddress,
  fundId,
  onMemberApproved,
}: MemberListProps) {
  const isOrganizer = currentWalletAddress === organizerAddress;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-lg font-semibold text-[#1A1A2E]">Members</h3>
        <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#6B7280]">
          {members.length}
        </span>
        {pendingMembers.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-[#F5A623]">
            <UserPlus className="h-3 w-3" />
            {pendingMembers.length} pending
          </span>
        )}
      </div>

      <div className="space-y-0">
        {/* Active members */}
        {members.map((member, index) => {
          const isOrganizerMember = member.walletAddress === organizerAddress;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
            >
              {index > 0 && <Separator className="my-3 bg-gray-100" />}
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback className="bg-[#FFF9E6] text-[#F5A623] text-xs font-medium">
                    {getInitials(member.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-[#1A1A2E]">
                      {member.displayName}
                    </span>
                    {isOrganizerMember && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-[#F5A623]" />
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {formatXrp(member.totalContributed)} XRP contributed
                  </p>
                </div>

                <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  Active
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Pending members */}
        {pendingMembers.length > 0 && (
          <>
            {members.length > 0 && (
              <Separator className="my-4 bg-gray-100" />
            )}
            <AnimatePresence mode="popLayout">
              {pendingMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                  transition={{ delay: index * 0.05, duration: 0.25 }}
                >
                  {index > 0 && <Separator className="my-3 bg-gray-100" />}
                  <PendingMemberRow
                    member={member}
                    isOrganizer={isOrganizer}
                    fundId={fundId}
                    organizerWallet={organizerAddress}
                    onApproved={onMemberApproved}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}

        {members.length === 0 && pendingMembers.length === 0 && (
          <p className="py-6 text-center text-sm text-[#6B7280]">
            No members yet. Share the invite code to get started.
          </p>
        )}
      </div>
    </div>
  );
}

export function MemberListSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
