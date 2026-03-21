import type { AccountInfoResponse, AccountObjectsResponse } from "xrpl";
import { xrpToDrops } from "../utils/xrp";
import { getClient } from "./client";

export interface SignerEntryInfo {
  account: string;
  signerWeight: number;
}

export interface SignerListInfo {
  signerQuorum: number;
  signerEntries: SignerEntryInfo[];
}

export interface TxHistoryEntry {
  hash: string;
  type: string;
  account: string;
  destination?: string;
  amount?: string;
  fee: string;
  date?: number;
  validated: boolean;
}

function isAccountNotFound(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Account not found")
  );
}

export async function getBalance(address: string): Promise<number> {
  try {
    const client = await getClient();
    const xrpBalance = await client.getXrpBalance(address);
    return xrpToDrops(xrpBalance);
  } catch (error) {
    if (isAccountNotFound(error)) {
      return 0;
    }
    throw error;
  }
}

export async function getAccountInfo(
  address: string,
  options?: { signerLists?: boolean }
): Promise<AccountInfoResponse["result"] | null> {
  try {
    const client = await getClient();
    const response = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "validated",
      signer_lists: options?.signerLists ?? false,
    });
    return response.result;
  } catch (error) {
    if (isAccountNotFound(error)) {
      return null;
    }
    throw error;
  }
}

export async function getTxHistory(
  address: string,
  limit: number = 20
): Promise<TxHistoryEntry[]> {
  let response;
  try {
    const client = await getClient();
    response = await client.request({
      command: "account_tx",
      account: address,
      limit,
    });
  } catch (error) {
    if (isAccountNotFound(error)) {
      return [];
    }
    throw error;
  }

  return response.result.transactions.map((tx) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txData = (tx.tx_json ?? {}) as Record<string, any>;
    return {
      hash: (tx.hash ?? txData.hash ?? "") as string,
      type: (txData.TransactionType ?? "") as string,
      account: (txData.Account ?? "") as string,
      destination: txData.Destination as string | undefined,
      amount:
        typeof txData.Amount === "string" ? txData.Amount : undefined,
      fee: (txData.Fee ?? "0") as string,
      date: txData.date as number | undefined,
      validated: tx.validated,
    };
  });
}

const BASE_RESERVE_DROPS = 10_000_000;
const OWNER_RESERVE_DROPS = 2_000_000;

export async function getAvailableBalance(address: string): Promise<number> {
  const info = await getAccountInfo(address);
  if (!info) return 0;

  const balance = Number(info.account_data.Balance);
  const ownerCount = info.account_data.OwnerCount;
  const reserve = BASE_RESERVE_DROPS + ownerCount * OWNER_RESERVE_DROPS;
  return Math.max(0, balance - reserve);
}

export interface EscrowInfo {
  account: string;
  destination: string;
  amount: string;
  condition?: string;
  cancelAfter?: number;
  finishAfter?: number;
  sequence: number;
}

export async function getEscrows(
  address: string
): Promise<EscrowInfo[]> {
  let response;
  try {
    const client = await getClient();
    response = await client.request({
      command: "account_objects",
      account: address,
      type: "escrow",
      ledger_index: "validated",
    });
  } catch (error) {
    if (isAccountNotFound(error)) {
      return [];
    }
    throw error;
  }

  return response.result.account_objects.map((obj) => {
    const escrow = obj as AccountObjectsResponse["result"]["account_objects"][0] & {
      Account: string;
      Destination: string;
      Amount: string;
      Condition?: string;
      CancelAfter?: number;
      FinishAfter?: number;
      Sequence: number;
    };
    return {
      account: escrow.Account,
      destination: escrow.Destination,
      amount: escrow.Amount,
      condition: escrow.Condition,
      cancelAfter: escrow.CancelAfter,
      finishAfter: escrow.FinishAfter,
      sequence: escrow.Sequence,
    };
  });
}

export async function getSignerList(
  address: string
): Promise<SignerListInfo | null> {
  let response;
  try {
    const client = await getClient();
    response = await client.request({
      command: "account_objects",
      account: address,
      type: "signer_list",
      ledger_index: "validated",
    });
  } catch (error) {
    if (isAccountNotFound(error)) {
      return null;
    }
    throw error;
  }

  const signerLists = response.result.account_objects;
  if (signerLists.length === 0) {
    return null;
  }

  const list = signerLists[0] as AccountObjectsResponse["result"]["account_objects"][0] & {
    SignerQuorum: number;
    SignerEntries: Array<{
      SignerEntry: { Account: string; SignerWeight: number };
    }>;
  };

  return {
    signerQuorum: list.SignerQuorum,
    signerEntries: list.SignerEntries.map((entry) => ({
      account: entry.SignerEntry.Account,
      signerWeight: entry.SignerEntry.SignerWeight,
    })),
  };
}
