import { Wallet } from "xrpl";
import { getClient } from "./client";

export interface FaucetResult {
  wallet: Wallet;
  balance: number;
}

export async function createTestnetWallet(): Promise<FaucetResult> {
  const client = await getClient();
  const { wallet, balance } = await client.fundWallet();
  return { wallet, balance };
}

export function walletFromSeed(seed: string): Wallet {
  return Wallet.fromSeed(seed);
}

export function generateWallet(): Wallet {
  return Wallet.generate();
}

export async function fundExistingWallet(
  wallet: Wallet,
  amount?: string
): Promise<FaucetResult> {
  const client = await getClient();
  const result = await client.fundWallet(wallet, { amount });
  return { wallet: result.wallet, balance: result.balance };
}

export interface WalletInfo {
  address: string;
  seed: string;
  publicKey: string;
}

export function getWalletInfo(wallet: Wallet): WalletInfo {
  return {
    address: wallet.classicAddress,
    seed: wallet.seed ?? "",
    publicKey: wallet.publicKey,
  };
}

export async function createFundWalletWithInfo(): Promise<
  WalletInfo & { balance: number }
> {
  const { wallet, balance } = await createTestnetWallet();
  return { ...getWalletInfo(wallet), balance };
}
