"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type RequestStatus = "submitted" | "voting" | "approved" | "released" | "expired";

export interface RequestProgressTrackerProps {
  status: RequestStatus;
  currentVotes?: number;
  quorumRequired?: number;
  timeRemaining?: string;
}

const STEPS_NORMAL = ["submitted", "voting", "approved", "released"] as const;
const STEPS_EXPIRED = ["submitted", "voting", "expired"] as const;

function getStepIndex(status: RequestStatus, steps: readonly string[]): number {
  return steps.indexOf(status);
}

/**
 * Placeholder component — final implementation handled externally.
 * Horizontal step indicator showing request progress.
 */
export function RequestProgressTracker({
  status,
  currentVotes,
  quorumRequired,
  timeRemaining,
}: RequestProgressTrackerProps) {
  const isExpired = status === "expired";
  const steps = isExpired ? STEPS_EXPIRED : STEPS_NORMAL;
  const activeIndex = getStepIndex(status, steps);

  return (
    <div className="w-full h-[80px] flex items-center">
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const isPast = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center relative">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 ${
                    isPast
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                        ? step === "expired"
                          ? "border-red-400 text-red-500 bg-red-50"
                          : "border-[#F5A623] text-[#F5A623] bg-[#FFF9E6]"
                        : "border-gray-200 text-gray-400 bg-gray-50"
                  }`}
                  animate={isActive && step !== "expired" ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {isPast ? <Check className="w-4 h-4" /> : i + 1}
                </motion.div>

                <span
                  className={`text-[10px] mt-1 capitalize whitespace-nowrap ${
                    isPast
                      ? "text-emerald-500"
                      : isActive
                        ? step === "expired"
                          ? "text-red-500"
                          : "text-[#F5A623]"
                        : "text-gray-400"
                  }`}
                >
                  {step}
                </span>

                {/* Voting info */}
                {step === "voting" && isActive && (
                  <div className="absolute top-full mt-3 text-center">
                    {currentVotes !== undefined && quorumRequired !== undefined && (
                      <span className="text-[10px] text-[#6B7280] block">
                        {currentVotes}/{quorumRequired} votes
                      </span>
                    )}
                    {timeRemaining && (
                      <span className="text-[10px] text-[#6B7280] block">{timeRemaining}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 relative">
                  <div className="absolute inset-0 bg-gray-200" />
                  {isPast && (
                    <motion.div
                      className="absolute inset-0 bg-emerald-500"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{ transformOrigin: "left" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
