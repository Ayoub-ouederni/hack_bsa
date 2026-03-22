"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

export interface SolidarityWallProps {
  currentVotes: number;
  quorumRequired: number;
  totalMembers: number;
  voterNames?: string[];
  quorumReached: boolean;
}

/**
 * Placeholder component — final implementation handled externally.
 * Displays voter silhouettes that appear as votes come in.
 */
export function SolidarityWall({
  currentVotes,
  quorumRequired,
  totalMembers,
  voterNames = [],
  quorumReached,
}: SolidarityWallProps) {
  const slots = Array.from({ length: totalMembers }, (_, i) => i);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-[#6B7280]">
          {currentVotes}/{quorumRequired} votes needed
        </span>
        {quorumReached && (
          <motion.span
            className="text-sm font-semibold text-emerald-500"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Enough votes!
          </motion.span>
        )}
      </div>

      {/* Wall */}
      <div className="flex items-end justify-center gap-4 h-[200px] px-4">
        <AnimatePresence>
          {slots.map((i) => {
            const hasVoted = i < currentVotes;
            const name = voterNames[i];

            return (
              <motion.div
                key={i}
                className="flex flex-col items-center gap-1"
                initial={hasVoted ? { opacity: 0, y: 20 } : false}
                animate={{
                  opacity: hasVoted ? 1 : 0.25,
                  y: 0,
                }}
                transition={{ duration: 0.5, delay: hasVoted ? i * 0.1 : 0 }}
              >
                <div
                  className={`rounded-full p-3 transition-colors duration-500 ${
                    quorumReached && hasVoted
                      ? "bg-emerald-100 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : hasVoted
                        ? "bg-[#FFF9E6] text-[#F5A623]"
                        : "bg-gray-100 text-gray-300"
                  }`}
                >
                  <User className="w-8 h-8" />
                </div>
                {name && (
                  <span
                    className={`text-xs ${
                      quorumReached && hasVoted ? "text-emerald-500" : "text-[#6B7280]"
                    }`}
                  >
                    {name}
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
