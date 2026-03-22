"use client";

import { useContext } from "react";
import { WalletContext, type WalletContextValue } from "@/contexts/WalletContext";

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
