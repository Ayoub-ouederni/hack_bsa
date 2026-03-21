import { getClient } from "./client";

export async function getBalance(address: string): Promise<number> {
  const client = await getClient();
  const balance = await client.getXrpBalance(address);
  return balance;
}
