import { Wallet } from "xrpl";
import { getClient } from "./client";

export interface FaucetResult {
  wallet: Wallet;
  balance: number;
}
