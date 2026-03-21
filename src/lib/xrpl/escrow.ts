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
