import type { Payment } from "xrpl";
import { isValidClassicAddress } from "xrpl";
import { getClient } from "./client";
import { getAccountSequence, getAvailableBalance } from "./account";

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
  data: string,
  format?: string
): { Memo: { MemoType: string; MemoData: string; MemoFormat?: string } } {
  const memo: { MemoType: string; MemoData: string; MemoFormat?: string } = {
    MemoType: toHex(type),
    MemoData: toHex(data),
  };
  if (format) {
    memo.MemoFormat = toHex(format);
  }
  return { Memo: memo };
}

export function isContributionMemo(memos: MemoData[]): boolean {
  return memos.some((m) => m.memoType === MEMO_TYPES.CONTRIBUTION);
}

export function isReleaseMemo(memos: MemoData[]): boolean {
  return memos.some((m) => m.memoType === MEMO_TYPES.RELEASE);
}

export function extractMemoId(memos: MemoData[], type: string): string | null {
  const memo = memos.find((m) => m.memoType === type);
  return memo?.memoData ?? null;
}

export async function canAffordContribution(
  address: string,
  amountDrops: number
): Promise<{ canAfford: boolean; availableDrops: number }> {
  const available = await getAvailableBalance(address);
  const totalNeeded = amountDrops + BASE_FEE_DROPS;
  return {
    canAfford: available >= totalNeeded,
    availableDrops: available,
  };
}

export const BASE_FEE_DROPS = 12;

export function calculateMultiSignFee(signerCount: number): number {
  return BASE_FEE_DROPS * (1 + signerCount);
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
  if (params.fromAddress === params.fundWalletAddress) {
    throw new Error("Sender and fund wallet addresses must be different");
  }
  validateAmount(params.amountDrops);

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: Payment = {
    TransactionType: "Payment",
    Account: params.fromAddress,
    Destination: params.fundWalletAddress,
    Amount: String(params.amountDrops),
    Memos: [buildMemo(MEMO_TYPES.CONTRIBUTION, params.fundId)],
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
  if (params.fundWalletAddress === params.recipientAddress) {
    throw new Error("Fund wallet and recipient addresses must be different");
  }
  validateAmount(params.amountDrops);

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const signerCount = params.signerCount ?? 1;
  const fee = String(calculateMultiSignFee(signerCount));
  const sequence = await getAccountSequence(params.fundWalletAddress);

  const tx: Payment = {
    TransactionType: "Payment",
    Account: params.fundWalletAddress,
    Destination: params.recipientAddress,
    Amount: String(params.amountDrops),
    Fee: fee,
    Sequence: sequence,
    SigningPubKey: "",
    Memos: [buildMemo(MEMO_TYPES.RELEASE, params.requestId)],
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_MULTISIGN,
  };

  return tx;
}
