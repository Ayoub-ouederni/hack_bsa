"use client";

import Link from "next/link";
import { Activity, User } from "lucide-react";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import { useWallet } from "@/lib/hooks/useWallet";

export function Header() {
  const { isConnected } = useWallet();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Activity className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Pulse</span>
        </Link>

        <div className="flex items-center gap-1">
          {isConnected && (
            <Link
              href="/profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
