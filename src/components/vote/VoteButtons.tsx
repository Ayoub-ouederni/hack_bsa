"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VoteButtonsProps {
  onSupport: () => Promise<void>;
  onPass?: () => void;
  disabled?: boolean;
  hasVoted?: boolean;
  isOwnRequest?: boolean;
}

export function VoteButtons({
  onSupport,
  onPass,
  disabled = false,
  hasVoted = false,
  isOwnRequest = false,
}: VoteButtonsProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<"success" | "error" | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSupport = async () => {
    setIsVoting(true);
    setError(null);
    setVoteResult(null);
    try {
      await onSupport();
      setVoteResult("success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to cast vote"
      );
      setVoteResult("error");
    } finally {
      setIsVoting(false);
    }
  };

  // Already voted state
  if (hasVoted || voteResult === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-6 ring-1 ring-primary/20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <CheckCircle2 className="size-10 text-primary" />
        </motion.div>
        <div className="text-center">
          <p className="font-medium text-primary">You showed solidarity</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your vote has been recorded.
          </p>
        </div>
      </motion.div>
    );
  }

  // Own request state
  if (isOwnRequest) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl bg-muted/50 p-6">
        <p className="text-sm text-muted-foreground">
          This is your request — you cannot vote on it.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Support button */}
      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          size="lg"
          className={cn(
            "relative w-full gap-2 overflow-hidden py-6 text-base",
            isVoting && "pointer-events-none"
          )}
          onClick={handleSupport}
          disabled={disabled || isVoting}
        >
          <AnimatePresence mode="wait">
            {isVoting ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="animate-spin" />
                Recording your vote...
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Heart />
                I support this request
                <ArrowRight />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Pass button */}
      {onPass && (
        <Button
          variant="ghost"
          className="text-muted-foreground"
          onClick={onPass}
          disabled={disabled || isVoting}
        >
          I pass for now
        </Button>
      )}

      {/* Error */}
      {error && voteResult === "error" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertCircle className="shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}
    </div>
  );
}
