import type { Payment } from "xrpl";
import { isValidClassicAddress } from "xrpl";
import { getClient } from "./client";
import { getAccountSequence } from "./account";

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

export interface MemoData {
  memoType: string;
  memoData: string;
}

export function decodeMemos(
  memos: Array<{ Memo: { MemoType?: string; MemoData?: string } }>
): MemoData[] {
  return memos.map(({ Memo }) => ({
    memoType: Memo.MemoType ? fromHex(Memo.MemoType) : "",
    memoData: Memo.MemoData ? fromHex(Memo.MemoData) : "",
  }));
}

export function buildMemo(
  type: string,
  data: string
): { Memo: { MemoType: string; MemoData: string } } {
  return {
    Memo: {
      MemoType: toHex(type),
      MemoData: toHex(data),
    },
  };
}

const LEDGER_OFFSET_STANDARD = 20;
const LEDGER_OFFSET_MULTISIGN = 75;

export interface ContributionTxParams {
  fromAddress: string;
  fundWalletAddress: string;
  amountDrops: number;
  fundId: string;
}

function validateAddress(address: string, label: string): void {
  if (!isValidClassicAddress(address)) {
    throw new Error(`Invalid ${label} address: ${address}`);
  }
}

function validateAmount(amountDrops: number): void {
  if (!Number.isInteger(amountDrops) || amountDrops <= 0) {
    throw new Error(`Amount must be a positive integer (drops), got: ${amountDrops}`);
  }
}

export async function buildContributionTx(
  params: ContributionTxParams
): Promise<Payment> {
  validateAddress(params.fromAddress, "sender");
  validateAddress(params.fundWalletAddress, "fund wallet");
  validateAmount(params.amountDrops);

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
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_STANDARD,
  };

  return tx;
}

export interface ReleaseTxParams {
  fundWalletAddress: string;
  recipientAddress: string;
  amountDrops: number;
  requestId: string;
  signerCount?: number;
}

export async function buildReleaseTx(
  params: ReleaseTxParams
): Promise<Payment> {
  validateAddress(params.fundWalletAddress, "fund wallet");
  validateAddress(params.recipientAddress, "recipient");
  validateAmount(params.amountDrops);

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const baseFee = 12;
  const signerCount = params.signerCount ?? 1;
  const fee = String(baseFee * (1 + signerCount));
  const sequence = await getAccountSequence(params.fundWalletAddress);

  const tx: Payment = {
    TransactionType: "Payment",
    Account: params.fundWalletAddress,
    Destination: params.recipientAddress,
    Amount: String(params.amountDrops),
    Fee: fee,
    Sequence: sequence,
    SigningPubKey: "",
    Memos: [
      {
        Memo: {
          MemoType: toHex(MEMO_TYPES.RELEASE),
          MemoData: toHex(params.requestId),
        },
      },
    ],
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_MULTISIGN,
  };

  return tx;
}
