import type { AccountInfoResponse } from "xrpl";
import { xrpToDrops } from "../utils/xrp";
import { getClient } from "./client";

export async function getBalance(address: string): Promise<number> {
  const client = await getClient();
  const xrpBalance = await client.getXrpBalance(address);
  return xrpToDrops(xrpBalance);
}
