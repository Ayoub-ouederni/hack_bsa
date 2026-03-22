"use client";

import { useState } from "react";
import { HeartbeatPulse } from "@/components/animations/HeartbeatPulse";
import type { HeartbeatPulseProps } from "@/components/animations/HeartbeatPulse";
import { SolidarityWall } from "@/components/animations/SolidarityWall";
import { RequestProgressTracker } from "@/components/animations/RequestProgressTracker";
import type { RequestStatus } from "@/components/animations/RequestProgressTracker";

const VOTER_NAMES = ["Alice", "Bob", "Carol", "Dave", "Eve"];

export default function TestAnimationsPage() {
  // Heartbeat state
  const [hbStatus, setHbStatus] = useState<HeartbeatPulseProps["status"]>("healthy");
  const [poolBalance, setPoolBalance] = useState(450);
  const [showRelease, setShowRelease] = useState(false);
  const [lastContrib, setLastContrib] = useState<HeartbeatPulseProps["lastContribution"]>();

  // Solidarity Wall state
  const [votes, setVotes] = useState(0);

  // Progress Tracker state
  const [reqStatus, setReqStatus] = useState<RequestStatus>("submitted");

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 space-y-16">
      <h1 className="text-3xl font-bold">Animation Components Test</h1>

      {/* ── HeartbeatPulse ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">HeartbeatPulse</h2>

        <div className="flex flex-wrap gap-2">
          {(["healthy", "warning", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setHbStatus(s)}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                hbStatus === s ? "bg-emerald-600" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => {
              const amount = Math.floor(Math.random() * 50) + 10;
              setPoolBalance((b) => b + amount);
              setLastContrib({ amount, timestamp: Date.now() });
            }}
            className="px-3 py-1.5 rounded text-sm bg-blue-600 hover:bg-blue-500"
          >
            Simulate Contribution
          </button>
          <button
            onClick={() => setShowRelease((r) => !r)}
            className={`px-3 py-1.5 rounded text-sm ${
              showRelease ? "bg-orange-600" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            {showRelease ? "Stop Release" : "Simulate Release"}
          </button>
        </div>

        <div className="flex justify-center">
          <HeartbeatPulse
            poolBalance={poolBalance}
            poolTarget={1000}
            status={hbStatus}
            lastContribution={lastContrib}
            activeRelease={
              showRelease ? { amount: 200, recipientName: "Alice" } : undefined
            }
          />
        </div>
      </section>

      {/* ── SolidarityWall ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">SolidarityWall</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setVotes((v) => Math.min(v + 1, 5))}
            className="px-3 py-1.5 rounded text-sm bg-emerald-600 hover:bg-emerald-500"
          >
            Add Vote (+1)
          </button>
          <button
            onClick={() => setVotes(0)}
            className="px-3 py-1.5 rounded text-sm bg-zinc-800 hover:bg-zinc-700"
          >
            Reset
          </button>
        </div>

        <SolidarityWall
          currentVotes={votes}
          quorumRequired={3}
          totalMembers={5}
          voterNames={VOTER_NAMES.slice(0, votes)}
          quorumReached={votes >= 3}
        />
      </section>

      {/* ── RequestProgressTracker ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-zinc-800 pb-2">
          RequestProgressTracker
        </h2>

        <div className="flex flex-wrap gap-2">
          {(["submitted", "voting", "approved", "released", "expired"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setReqStatus(s)}
              className={`px-3 py-1.5 rounded text-sm capitalize ${
                reqStatus === s ? "bg-emerald-600" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <RequestProgressTracker
          status={reqStatus}
          currentVotes={votes}
          quorumRequired={3}
          timeRemaining="23h 15m"
        />
      </section>
    </div>
  );
}
