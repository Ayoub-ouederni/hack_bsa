"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Pulse</span>
        </Link>

        <ConnectWallet />
      </div>
    </header>
  );
}
