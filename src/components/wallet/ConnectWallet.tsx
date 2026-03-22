"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useWallet } from "@/lib/hooks/useWallet";
import { WalletNotAvailableError } from "@/lib/wallet/client";
import type { WalletType } from "@/lib/wallet/client";

const WALLETS: { id: WalletType; name: string; description: string }[] = [
  {
    id: "gemwallet",
    name: "GemWallet",
    description: "Browser extension",
  },
  {
    id: "xaman",
    name: "Xaman (Xumm)",
    description: "Mobile app",
  },
  {
    id: "crossmark",
    name: "Crossmark",
    description: "Browser extension",
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "Hardware wallet",
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    description: "Scan QR code",
  },
];

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWallet() {
  const { address, isConnected, isConnecting, connect, disconnect, walletType } =
    useWallet();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<WalletType | null>(null);

  const handleConnect = async (type: WalletType) => {
    setConnectingWallet(type);
    try {
      await connect(type);
      setDialogOpen(false);
    } catch (err) {
      const walletName = WALLETS.find((w) => w.id === type)?.name ?? type;
      if (err instanceof WalletNotAvailableError) {
        toast.error(`${walletName} not available`, {
          description: `Please install the ${walletName} extension and refresh the page.`,
        });
      } else {
        toast.error("Connection failed", {
          description: `Could not connect to ${walletName}. Please try again.`,
        });
      }
    } finally {
      setConnectingWallet(null);
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
          className="font-mono text-xs text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="mr-1.5 h-3 w-3 text-primary" />
          ) : (
            <Copy className="mr-1.5 h-3 w-3" />
          )}
          {truncateAddress(address)}
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
    <>
      <Button
        onClick={() => setDialogOpen(true)}
        disabled={isConnecting}
        size="sm"
        className="gap-2"
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        Connect Wallet
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect your wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to Pulse on XRPL Testnet.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 pt-2">
            <AnimatePresence>
              {WALLETS.map((wallet, i) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => handleConnect(wallet.id)}
                    disabled={connectingWallet !== null}
                    className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent disabled:opacity-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.description}
                      </p>
                    </div>
                    {connectingWallet === wallet.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
