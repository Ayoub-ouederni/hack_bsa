"use client";

import {
  isInstalled,
  getAddress,
  submitTransaction as gemSubmit,
  signTransaction as gemSign,
} from "@gemwallet/api";
import type { SubmittableTransaction } from "xrpl";

export class WalletNotAvailableError extends Error {
  constructor() {
    super("GemWallet is not installed or not available in your browser.");
    this.name = "WalletNotAvailableError";
  }
}

export interface ConnectResult {
  address: string;
}

export async function connectWallet(): Promise<ConnectResult> {
  const installed = await isInstalled();
  if (!installed.result.isInstalled) {
    throw new WalletNotAvailableError();
  }

  const response = await getAddress();
  if (!response.result) {
    throw new Error("Failed to get address from GemWallet.");
  }

  return { address: response.result.address };
}

export async function disconnectWallet(): Promise<void> {
  // GemWallet is stateless — we just clear local state in the context.
}

export interface SubmitResult {
  hash: string;
}

export async function submitTransaction(
  transaction: Record<string, unknown>
): Promise<SubmitResult> {
  const installed = await isInstalled();
  if (!installed.result.isInstalled) {
    throw new WalletNotAvailableError();
  }

  const response = await gemSubmit({
    transaction: transaction as unknown as SubmittableTransaction,
  });
  if (!response.result) {
    throw new Error("Transaction was rejected or failed.");
  }

  return { hash: response.result.hash };
}

export interface SignResult {
  tx_blob: string;
}

export async function signTransaction(
  transaction: Record<string, unknown>
): Promise<SignResult> {
  const installed = await isInstalled();
  if (!installed.result.isInstalled) {
    throw new WalletNotAvailableError();
  }

  const response = await gemSign({
    transaction: transaction as unknown as SubmittableTransaction,
  });
  if (!response.result?.signature) {
    throw new Error("Transaction signing was rejected.");
  }

  return { tx_blob: response.result.signature };
}
