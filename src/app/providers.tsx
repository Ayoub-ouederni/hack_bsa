"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "@/contexts/WalletContext";

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
