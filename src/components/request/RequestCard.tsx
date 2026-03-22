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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RequestStatus } from "@/types/request";
import { cn } from "@/lib/utils";

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

const STATUS_CONFIG: Record<
  RequestStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
> = {
  submitted: {
    label: "Submitted",
    variant: "secondary",
    icon: Clock,
  },
  voting: {
    label: "Voting",
    variant: "default",
    icon: Users,
  },
  approved: {
    label: "Approved",
    variant: "outline",
    icon: CheckCircle2,
  },
  released: {
    label: "Released",
    variant: "default",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    variant: "destructive",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    variant: "destructive",
    icon: XCircle,
  },
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
    quorumRequired > 0 ? (voteCount / quorumRequired) * 100 : 0;
  const isVotable = status === "voting" && !isOwnRequest && onVote;
  const isActive = status === "voting" || status === "submitted";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "transition-shadow hover:ring-foreground/20",
          isActive && "ring-primary/20"
        )}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2">
                <Coins className="shrink-0 text-primary" />
                <span className="font-mono">{dropsToXRP(amount)} XRP</span>
              </CardTitle>
              <CardDescription className="mt-1">
                {requesterName || truncateAddress(requesterAddress)}
                {isOwnRequest && (
                  <span className="ml-1.5 text-primary">(you)</span>
                )}
                <span className="mx-1.5 text-border">·</span>
                {new Date(createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Badge variant={config.variant} className="shrink-0">
              <StatusIcon data-icon="inline-start" />
              {config.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Description */}
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {description}
          </p>

          {/* Vote progress */}
          {(status === "voting" || status === "submitted") && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Votes of support
                </span>
                <span className="font-medium">
                  {voteCount} / {quorumRequired}
                </span>
              </div>
              <Progress value={voteProgress} className="h-2" />
            </div>
          )}

          {/* Time remaining */}
          {timeRemaining && status === "voting" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="text-chart-3 shrink-0" />
              <span>{timeRemaining} remaining</span>
            </div>
          )}
        </CardContent>

        {/* Action footer */}
        {(isVotable || onView) && (
          <CardFooter className="gap-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1"
                onClick={() => onView(id)}
              >
                View details
              </Button>
            )}
            {isVotable && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onVote(id)}
              >
                Support
                <ArrowRight data-icon="inline-end" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
