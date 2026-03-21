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

function validateAddress(address: string, label: string): void {
  if (!isValidClassicAddress(address)) {
    throw new Error(`Invalid ${label} address: ${address}`);
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
}
