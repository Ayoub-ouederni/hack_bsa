import type { EscrowCreate, EscrowFinish, EscrowCancel } from "xrpl";
import { isValidClassicAddress, Wallet } from "xrpl";
import { getClient } from "./client";
import { getAccountSequence, getAvailableBalance } from "./account";
import { isValidConditionHex, isValidFulfillmentHex } from "./conditions";
import { calculateMultiSignFee, BASE_FEE_DROPS } from "./payment";

const RIPPLE_EPOCH_OFFSET = 946684800;

const LEDGER_OFFSET_ESCROW = 20;

const LEDGER_OFFSET_ESCROW_FINISH = 75;

const DEFAULT_ESCROW_EXPIRY_SECONDS = 600;

const OWNER_RESERVE_DROPS = 2_000_000;

const MIN_ESCROW_EXPIRY_SECONDS = 10;

export interface CreateEscrowParams {
  fundWalletSeed: string;
  recipientAddress: string;
  amountDrops: number;
  conditionHex: string;
  cancelAfterSeconds?: number;
}

export interface CreateEscrowResult {
  escrowSequence: number;
  txHash: string;
}

export interface BuildEscrowFinishParams {
  ownerAddress: string;
  escrowSequence: number;
  conditionHex: string;
  fulfillmentHex: string;
  signerCount?: number;
}

export interface CancelEscrowParams {
  fundWalletSeed: string;
  ownerAddress: string;
  escrowSequence: number;
}

export interface CancelEscrowResult {
  txHash: string;
}

function unixToRippleTime(unixSeconds: number): number {
  return unixSeconds - RIPPLE_EPOCH_OFFSET;
}

export function rippleTimeToUnix(rippleSeconds: number): number {
  return rippleSeconds + RIPPLE_EPOCH_OFFSET;
}

export function rippleTimeToDate(rippleSeconds: number): Date {
  return new Date(rippleTimeToUnix(rippleSeconds) * 1000);
}

function getEscrowExpirySeconds(): number {
  const envValue = process.env.ESCROW_EXPIRY_SECONDS;
  if (envValue) {
    const parsed = parseInt(envValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return DEFAULT_ESCROW_EXPIRY_SECONDS;
}

export function getEscrowTimeRemaining(cancelAfterRipple: number): number {
  const nowRipple = unixToRippleTime(Math.floor(Date.now() / 1000));
  return Math.max(0, cancelAfterRipple - nowRipple);
}

export function isEscrowExpired(cancelAfterRipple: number): boolean {
  const nowRipple = unixToRippleTime(Math.floor(Date.now() / 1000));
  return nowRipple >= cancelAfterRipple;
}

function getTransactionResult(meta: unknown): string | null {
  if (
    typeof meta === "object" &&
    meta !== null &&
    "TransactionResult" in meta
  ) {
    return (meta as { TransactionResult: string }).TransactionResult;
  }
  return null;
}

function validateAddress(address: string, label: string): void {
  if (!isValidClassicAddress(address)) {
    throw new Error(`Invalid ${label} address: ${address}`);
  }
}

function validateEscrowSequence(sequence: number): void {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error(
      `Escrow sequence must be a non-negative integer, got: ${sequence}`
    );
  }
}

function validateAmount(amountDrops: number): void {
  if (!Number.isInteger(amountDrops) || amountDrops <= 0) {
    throw new Error(
      `Amount must be a positive integer (drops), got: ${amountDrops}`
    );
  }
}

export async function canCreateEscrow(
  fundWalletAddress: string,
  amountDrops: number
): Promise<{ canCreate: boolean; availableDrops: number }> {
  const available = await getAvailableBalance(fundWalletAddress);
  const totalNeeded = amountDrops + OWNER_RESERVE_DROPS + BASE_FEE_DROPS;
  return {
    canCreate: available >= totalNeeded,
    availableDrops: available,
  };
}

export async function createEscrow(
  params: CreateEscrowParams
): Promise<CreateEscrowResult> {
  validateAddress(params.recipientAddress, "recipient");
  validateAmount(params.amountDrops);

  if (!isValidConditionHex(params.conditionHex)) {
    throw new Error("Invalid condition hex format");
  }

  const wallet = Wallet.fromSeed(params.fundWalletSeed);
  validateAddress(wallet.address, "fund wallet");

  if (wallet.address === params.recipientAddress) {
    throw new Error("Fund wallet and recipient addresses must be different");
  }

  const expirySeconds =
    params.cancelAfterSeconds ?? getEscrowExpirySeconds();

  if (expirySeconds < MIN_ESCROW_EXPIRY_SECONDS) {
    throw new Error(
      `Escrow expiry must be at least ${MIN_ESCROW_EXPIRY_SECONDS} seconds, got: ${expirySeconds}`
    );
  }
  const cancelAfterRipple = unixToRippleTime(
    Math.floor(Date.now() / 1000) + expirySeconds
  );

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: EscrowCreate = {
    TransactionType: "EscrowCreate",
    Account: wallet.address,
    Destination: params.recipientAddress,
    Amount: String(params.amountDrops),
    Condition: params.conditionHex,
    CancelAfter: cancelAfterRipple,
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_ESCROW,
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = getTransactionResult(result.result.meta);
  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`EscrowCreate failed: ${txResult}`);
  }

  const sequence = (result.result.tx_json as Record<string, unknown>)
    ?.Sequence as number;

  return {
    escrowSequence: sequence,
    txHash: result.result.hash,
  };
}

export async function buildEscrowFinishTx(
  params: BuildEscrowFinishParams
): Promise<EscrowFinish> {
  validateAddress(params.ownerAddress, "owner");

  if (!isValidConditionHex(params.conditionHex)) {
    throw new Error("Invalid condition hex format");
  }

  if (!isValidFulfillmentHex(params.fulfillmentHex)) {
    throw new Error("Invalid fulfillment hex format");
  }

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();
  const sequence = await getAccountSequence(params.ownerAddress);
  const signerCount = params.signerCount ?? 1;
  const fee = String(calculateMultiSignFee(signerCount));

  const tx: EscrowFinish = {
    TransactionType: "EscrowFinish",
    Account: params.ownerAddress,
    Owner: params.ownerAddress,
    OfferSequence: params.escrowSequence,
    Condition: params.conditionHex,
    Fulfillment: params.fulfillmentHex,
    Fee: fee,
    Sequence: sequence,
    SigningPubKey: "",
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_ESCROW_FINISH,
  };

  return tx;
}

export async function cancelEscrow(
  params: CancelEscrowParams
): Promise<CancelEscrowResult> {
  validateAddress(params.ownerAddress, "owner");

  const wallet = Wallet.fromSeed(params.fundWalletSeed);

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: EscrowCancel = {
    TransactionType: "EscrowCancel",
    Account: wallet.address,
    Owner: params.ownerAddress,
    OfferSequence: params.escrowSequence,
    LastLedgerSequence: currentLedger + LEDGER_OFFSET_ESCROW,
  };

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = getTransactionResult(result.result.meta);
  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`EscrowCancel failed: ${txResult}`);
  }

  return {
    txHash: result.result.hash,
  };
}
