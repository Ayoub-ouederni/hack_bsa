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

export async function fundExistingWallet(
  wallet: Wallet,
  amount?: string
): Promise<FaucetResult> {
  const client = await getClient();
  const result = await client.fundWallet(wallet, { amount });
  return { wallet: result.wallet, balance: result.balance };
}
