import type { Payment } from "xrpl";
import { getClient } from "./client";

export function toHex(text: string): string {
  return Buffer.from(text, "utf-8").toString("hex").toUpperCase();
}

export function fromHex(hex: string): string {
  return Buffer.from(hex, "hex").toString("utf-8");
}

export const MEMO_TYPES = {
  CONTRIBUTION: "pulse/contribution",
  RELEASE: "pulse/release",
} as const;

export interface ContributionTxParams {
  fromAddress: string;
  fundWalletAddress: string;
  amountDrops: number;
  fundId: string;
}

export async function buildContributionTx(
  params: ContributionTxParams
): Promise<Payment> {
  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: Payment = {
    TransactionType: "Payment",
    Account: params.fromAddress,
    Destination: params.fundWalletAddress,
    Amount: String(params.amountDrops),
    Memos: [
      {
        Memo: {
          MemoType: toHex(MEMO_TYPES.CONTRIBUTION),
          MemoData: toHex(params.fundId),
        },
      },
    ],
    LastLedgerSequence: currentLedger + 20,
  };

  return tx;
}

export interface ReleaseTxParams {
  fundWalletAddress: string;
  recipientAddress: string;
  amountDrops: number;
  requestId: string;
}

export async function buildReleaseTx(
  params: ReleaseTxParams
): Promise<Payment> {
  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: Payment = {
    TransactionType: "Payment",
    Account: params.fundWalletAddress,
    Destination: params.recipientAddress,
    Amount: String(params.amountDrops),
    Memos: [
      {
        Memo: {
          MemoType: toHex(MEMO_TYPES.RELEASE),
          MemoData: toHex(params.requestId),
        },
      },
    ],
    LastLedgerSequence: currentLedger + 20,
  };

  return tx;
}
