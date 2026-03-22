"use client";

import type {
  WalletManager,
  WalletAccount,
  SignedTransaction,
  WalletAdapterInfo,
} from "xrpl-connect";

let walletManager: WalletManager | null = null;
let initPromise: Promise<WalletManager> | null = null;

export type WalletType =
  | "gemwallet"
  | "xaman"
  | "crossmark"
  | "ledger"
  | "walletconnect";

export class WalletNotAvailableError extends Error {
  walletType: WalletType;
  constructor(walletType: WalletType) {
    super(`${walletType} is not installed or not available in your browser.`);
    this.name = "WalletNotAvailableError";
    this.walletType = walletType;
  }
}

async function createAdapters(): Promise<unknown[]> {
  const mod = await import("xrpl-connect");
  return [
    new mod.GemWalletAdapter(),
    new mod.XamanAdapter(),
    new mod.CrossmarkAdapter(),
    new mod.LedgerAdapter(),
    new mod.WalletConnectAdapter(),
  ];
}

export async function getWalletManager(): Promise<WalletManager> {
  if (walletManager) return walletManager;

  if (!initPromise) {
    initPromise = (async () => {
      const mod = await import("xrpl-connect");
      const adapters = await createAdapters();
      const network = process.env.NEXT_PUBLIC_XRPL_NETWORK || "testnet";

      walletManager = new mod.WalletManager({
        adapters,
        network,
        autoConnect: true,
      });
      return walletManager;
    })();
  }

  return initPromise;
}

export interface ConnectResult {
  address: string;
  walletType: string;
  network?: string;
}

export async function connectWallet(
  walletType?: WalletType
): Promise<ConnectResult> {
  const manager = await getWalletManager();

  if (walletType) {
    const walletId = resolveWalletId(manager, walletType);
    try {
      const account: WalletAccount = await manager.connect(walletId);
      return {
        address: account.address,
        walletType,
        network: account.network,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.toLowerCase().includes("not currently available") ||
        message.toLowerCase().includes("not installed") ||
        message.toLowerCase().includes("not found")
      ) {
        throw new WalletNotAvailableError(walletType);
      }
      throw err;
    }
  }

  const adapters: WalletAdapterInfo[] = manager.wallets;
  if (!adapters || adapters.length === 0) {
    throw new Error("No wallet adapters available");
  }
  const account: WalletAccount = await manager.connect(adapters[0].id);
  return {
    address: account.address,
    walletType: adapters[0].id,
    network: account.network,
  };
}

export async function getWalletAddress(): Promise<string | null> {
  const manager = await getWalletManager();
  return manager.connected ? manager.account?.address ?? null : null;
}

export async function isWalletConnected(): Promise<boolean> {
  const manager = await getWalletManager();
  return manager.connected;
}

export async function disconnectWallet(): Promise<void> {
  const manager = await getWalletManager();
  if (manager.connected) {
    await manager.disconnect();
  }
}

export interface SignResult {
  tx_blob: string;
  hash?: string;
}

export async function signTransaction(
  transaction: Record<string, unknown>
): Promise<SignResult> {
  const manager = await getWalletManager();
  if (!manager.connected) {
    throw new Error("No wallet connected. Connect a wallet first.");
  }
  const result: SignedTransaction = await manager.sign(transaction);
  return {
    tx_blob: result.tx_blob,
    hash: result.hash,
  };
}

export interface SubmitResult {
  hash: string;
  tx_blob?: string;
}

export async function submitTransaction(
  transaction: Record<string, unknown>
): Promise<SubmitResult> {
  const manager = await getWalletManager();
  if (!manager.connected) {
    throw new Error("No wallet connected. Connect a wallet first.");
  }
  const result: SignedTransaction = await manager.signAndSubmit(transaction);
  return {
    hash: result.hash ?? result.id ?? "",
    tx_blob: result.tx_blob,
  };
}

function resolveWalletId(manager: WalletManager, walletType: WalletType): string {
  const wallets: WalletAdapterInfo[] = manager.wallets;
  if (!wallets) return walletType;

  const match = wallets.find(
    (w) => w.id.toLowerCase().includes(walletType.toLowerCase())
  );
  return match?.id ?? walletType;
}
