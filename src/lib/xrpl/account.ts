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

export async function getBalance(address: string): Promise<number> {
  const client = await getClient();
  const xrpBalance = await client.getXrpBalance(address);
  return xrpToDrops(xrpBalance);
}

export async function getAccountInfo(
  address: string,
  options?: { signerLists?: boolean }
): Promise<AccountInfoResponse["result"]> {
  const client = await getClient();
  const response = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
    signer_lists: options?.signerLists ?? false,
  });
  return response.result;
}

export async function getSignerList(
  address: string
): Promise<SignerListInfo | null> {
  const client = await getClient();
  const response = await client.request({
    command: "account_objects",
    account: address,
    type: "signer_list",
    ledger_index: "validated",
  });

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
