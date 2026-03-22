"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet as connectWalletClient,
  disconnectWallet as disconnectWalletClient,
  getWalletManager,
  type WalletType,
} from "@/lib/wallet/client";
import { getSignerAddress } from "@/lib/wallet/signer";

const PERSISTED_KEY = "pulse:wallet";

interface PersistedWallet {
  address: string;
  walletType: string;
}

export interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  walletType: string | null;
  /** Returns the signer address for a given fund (from localStorage keypairs) */
  getSignerAddressForFund: (fundId: string) => string | null;
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

export const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
  walletType: null,
  getSignerAddressForFund: () => null,
  connect: async () => {},
  disconnect: async () => {},
  isConnecting: false,
});

function loadPersistedWallet(): PersistedWallet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PERSISTED_KEY);
    return raw ? (JSON.parse(raw) as PersistedWallet) : null;
  } catch {
    return null;
  }
}

function persistWallet(wallet: PersistedWallet | null): void {
  if (typeof window === "undefined") return;
  if (wallet) {
    localStorage.setItem(PERSISTED_KEY, JSON.stringify(wallet));
  } else {
    localStorage.removeItem(PERSISTED_KEY);
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-reconnect from persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedWallet();
    if (!persisted) return;

    let cancelled = false;

    const tryReconnect = async () => {
      try {
        setIsConnecting(true);

        // Timeout the entire reconnect attempt to prevent infinite loading
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auto-reconnect timed out")), 8000)
        );

        const reconnect = async () => {
          const manager = await getWalletManager();

          // If manager already connected
          if (manager.connected && manager.account?.address) {
            return manager.account.address;
          }

          // Try to explicitly reconnect with the persisted wallet type
          const result = await connectWalletClient(
            persisted.walletType as WalletType
          );
          return result.address;
        };

        const address = await Promise.race([reconnect(), timeout]);
        if (!cancelled) {
          setAddress(address);
          setWalletType(persisted.walletType);
        }
      } catch {
        // Auto-reconnect failed, clear persisted data
        persistWallet(null);
      } finally {
        if (!cancelled) setIsConnecting(false);
      }
    };

    tryReconnect();
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for disconnect events
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      const manager = await getWalletManager();
      const handleDisconnect = () => {
        setAddress(null);
        setWalletType(null);
        persistWallet(null);
      };
      manager.on("disconnect", handleDisconnect);
      cleanup = () => manager.off("disconnect", handleDisconnect);
    };

    setup();
    return () => cleanup?.();
  }, []);

  const connect = useCallback(async (type?: WalletType) => {
    setIsConnecting(true);
    try {
      const result = await connectWalletClient(type);
      setAddress(result.address);
      setWalletType(result.walletType);
      persistWallet({
        address: result.address,
        walletType: result.walletType,
      });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWalletClient();
    setAddress(null);
    setWalletType(null);
    persistWallet(null);
  }, []);

  const getSignerAddressForFund = useCallback(
    (fundId: string) => getSignerAddress(fundId),
    []
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      isConnected: address !== null,
      walletType,
      getSignerAddressForFund,
      connect,
      disconnect,
      isConnecting,
    }),
    [address, walletType, getSignerAddressForFund, connect, disconnect, isConnecting]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
