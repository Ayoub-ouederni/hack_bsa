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
} from "@/lib/wallet/client";
import { getSignerAddress } from "@/lib/wallet/signer";

const PERSISTED_KEY = "pulse:wallet";

interface PersistedWallet {
  address: string;
}

export interface WalletContextValue {
  address: string | null;
  isConnected: boolean;
  /** Returns the signer address for a given fund (from localStorage keypairs) */
  getSignerAddressForFund: (fundId: string) => string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
}

export const WalletContext = createContext<WalletContextValue>({
  address: null,
  isConnected: false,
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
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-reconnect from persisted state on mount
  useEffect(() => {
    const persisted = loadPersistedWallet();
    if (!persisted) return;

    let cancelled = false;

    const tryReconnect = async () => {
      try {
        setIsConnecting(true);
        const result = await connectWalletClient();
        if (!cancelled) {
          setAddress(result.address);
          persistWallet({ address: result.address });
        }
      } catch {
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

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const result = await connectWalletClient();
      setAddress(result.address);
      persistWallet({ address: result.address });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await disconnectWalletClient();
    setAddress(null);
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
      getSignerAddressForFund,
      connect,
      disconnect,
      isConnecting,
    }),
    [address, getSignerAddressForFund, connect, disconnect, isConnecting]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
