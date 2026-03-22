"use client";

import { useState } from "react";
import { Wallet, LogOut, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWallet } from "@/lib/hooks/useWallet";
import { WalletNotAvailableError } from "@/lib/wallet/client";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, connect, disconnect } =
    useWallet();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      if (err instanceof WalletNotAvailableError) {
        toast.error("GemWallet not available", {
          description:
            "Please install the GemWallet extension and refresh the page.",
        });
      } else {
        toast.error("Connection failed", {
          description: "Could not connect to GemWallet. Please try again.",
        });
      }
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
          title={address}
        >
          {copied ? (
            <Check className="mr-1.5 h-3.5 w-3.5 text-primary" />
          ) : (
            <Wallet className="mr-1.5 h-3.5 w-3.5" />
          )}
          {copied ? "Copied!" : "My Wallet"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={disconnect}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      size="sm"
      className="gap-2 bg-[#F5A623] hover:bg-[#E09000] text-white rounded-xl px-6"
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wallet className="h-4 w-4" />
      )}
      Connect Wallet
    </Button>
  );
}
