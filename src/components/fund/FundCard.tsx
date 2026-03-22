"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, AlertCircle, ChevronRight, Shield } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Fund } from "@/types/fund";

interface FundCardProps {
  fund: Fund & { memberCount: number; requestCount: number };
}

export function FundCard({ fund }: FundCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link href={`/fund/${fund.id}`} className="block group">
        <Card className="relative transition-all duration-200 hover:ring-primary/30 hover:shadow-lg hover:shadow-primary/5">
          {/* Subtle gradient accent on hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <CardHeader className="relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight">
                    {fund.name}
                  </CardTitle>
                  {fund.description && (
                    <CardDescription className="mt-0.5 line-clamp-1 text-xs">
                      {fund.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </CardHeader>

          <CardContent className="relative">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>
                  {fund.memberCount}{" "}
                  {fund.memberCount === 1 ? "member" : "members"}
                </span>
              </div>

              {fund.requestCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fund.requestCount} active
                </Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="relative">
            <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
              <span>
                Votes needed: {fund.quorumRequired} /{" "}
                {fund.memberCount || "..."}
              </span>
              <span>
                Min: {(fund.minContribution / 1_000_000).toFixed(0)} XRP
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

export function FundCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </CardContent>
      <CardFooter>
        <div className="flex w-full justify-between">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        </div>
      </CardFooter>
    </Card>
  );
}
