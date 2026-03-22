"use client";

import { useMemo } from "react";

export interface HeartbeatPulseProps {
  poolBalance: number;
  poolTarget: number;
  status: "healthy" | "warning" | "critical";
  lastContribution?: {
    amount: number;
    timestamp: number;
  };
  activeRelease?: {
    amount: number;
    recipientName: string;
  };
}

const STATUS_CONFIG = {
  healthy: { color: "#22c55e", duration: "1s", label: "Healthy" },
  warning: { color: "#f97316", duration: "1.5s", label: "Warning" },
  critical: { color: "#ef4444", duration: "2s", label: "Critical" },
} as const;

export function HeartbeatPulse({
  poolBalance,
  poolTarget,
  status,
  lastContribution,
  activeRelease,
}: HeartbeatPulseProps) {
  const config = STATUS_CONFIG[status];
  const pct = Math.min((poolBalance / poolTarget) * 100, 100);

  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        left: `${46 + Math.random() * 8}%`,
        delay: `${i * 0.15}s`,
      })),
    []
  );

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Heart container */}
      <div
        className={`relative w-[300px] h-[300px] flex items-center justify-center ${
          activeRelease ? "releasing" : ""
        }`}
      >
        {/* Pulsing heart SVG */}
        <svg
          className="heart-svg w-44 h-44"
          style={
            {
              "--pulse-duration": config.duration,
              color: config.color,
              filter: `drop-shadow(0 0 20px ${config.color}66)`,
            } as React.CSSProperties
          }
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>

        {/* Balance overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-white drop-shadow-lg">
            {poolBalance} XRP
          </span>
          <span className="text-xs text-zinc-400 mt-1">
            {pct.toFixed(0)}% of {poolTarget} XRP
          </span>
          <span className="text-xs mt-1 font-medium" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>

        {/* Money flow particles (visible only during active release) */}
        {activeRelease && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p, i) => (
              <div
                key={i}
                className="heartbeat-particle"
                style={{ left: p.left, animationDelay: p.delay }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Last contribution */}
      {lastContribution && (
        <p className="text-xs text-zinc-500 mt-2">
          Last: +{lastContribution.amount} XRP
        </p>
      )}

      {/* Active release indicator */}
      {activeRelease && (
        <p className="text-xs text-emerald-400 mt-1 animate-pulse">
          Releasing {activeRelease.amount} XRP &rarr; {activeRelease.recipientName}
        </p>
      )}
    </div>
  );
}
