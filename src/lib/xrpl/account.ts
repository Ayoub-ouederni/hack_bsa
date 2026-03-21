import type { AccountInfoResponse } from "xrpl";
import { xrpToDrops } from "../utils/xrp";
import { getClient } from "./client";

export async function getBalance(address: string): Promise<number> {
  const client = await getClient();
  const xrpBalance = await client.getXrpBalance(address);
  return xrpToDrops(xrpBalance);
}

export async function getAccountInfo(
  address: string
): Promise<AccountInfoResponse["result"]> {
  const client = await getClient();
  const response = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
  });
  return response.result;
}
