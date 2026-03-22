"use client";

import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { Member } from "@/types/fund";

interface MemberListProps {
  members: Member[];
  organizerAddress: string;
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

const statusStyles: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
  active: { variant: "default", label: "Active" },
  inactive: { variant: "secondary", label: "Inactive" },
  removable: { variant: "outline", label: "Removable" },
};

export function MemberList({ members, organizerAddress }: MemberListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Members
          <Badge variant="secondary" className="text-xs font-normal">
            {members.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-0">
        {members.map((member, index) => {
          const isOrganizer = member.walletAddress === organizerAddress;
          const style = statusStyles[member.status] ?? statusStyles.active;

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.25 }}
            >
              {index > 0 && <Separator className="my-3" />}
              <div className="flex items-center gap-3">
                <Avatar size="default">
                  <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {member.displayName}
                    </span>
                    {isOrganizer && (
                      <Crown className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatXrp(member.totalContributed)} XRP contributed
                  </p>
                </div>

                <Badge variant={style.variant} className="shrink-0">
                  {style.label}
                </Badge>
              </div>
            </motion.div>
          );
        })}

        {members.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No members yet. Share the invite code to get started.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function MemberListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
