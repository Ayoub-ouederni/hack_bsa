"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Users,
  Vote,
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ZkProofData {
  proofHash: string;
  yesVotes: number;
  quorum: number;
  voterCount: number;
  generatedAt: string;
  txHash?: string;
}

interface ZkProofBadgeProps {
  zkProof: ZkProofData;
  fundWalletAddress?: string;
}

export function ZkProofBadge({ zkProof, fundWalletAddress }: ZkProofBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(zkProof.proofHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ledgerUrl = fundWalletAddress
    ? `https://testnet.xrpl.org/accounts/${fundWalletAddress}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50"
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-emerald-50/50"
      >
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-emerald-700">
                ZK Proof Verified
              </span>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-[10px] font-medium text-emerald-600"
              >
                Groth16
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Vote result cryptographically proven — individual votes remain private
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-emerald-100 px-5 pb-5 pt-4 space-y-4">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<Vote className="h-4 w-4 text-emerald-600" />}
                  label="Yes votes"
                  value={String(zkProof.yesVotes)}
                />
                <StatCard
                  icon={<Users className="h-4 w-4 text-blue-600" />}
                  label="Total voters"
                  value={String(zkProof.voterCount)}
                />
                <StatCard
                  icon={<Lock className="h-4 w-4 text-amber-600" />}
                  label="Quorum"
                  value={String(zkProof.quorum)}
                />
              </div>

              {/* Proof hash */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Fingerprint className="h-3.5 w-3.5" />
                  Proof hash (SHA-256)
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-[11px] text-gray-700">
                    {zkProof.proofHash}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-[11px] text-muted-foreground">
                Generated {new Date(zkProof.generatedAt).toLocaleString()}
              </p>

              {/* View on ledger */}
              {ledgerUrl && (
                <a
                  href={ledgerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                >
                  <ExternalLink className="h-3 w-3" />
                  View proof on XRPL Testnet
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/80 border border-gray-100 p-3 text-center shadow-sm">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
