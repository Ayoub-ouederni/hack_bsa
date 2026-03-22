import type { SignerListSet, Transaction } from "xrpl";
import { isValidClassicAddress, multisign, Wallet } from "xrpl";
import { getClient } from "./client";
import { getAccountSequence, getSignerList } from "./account";
import { calculateMultiSignFee } from "./payment";

const LEDGER_OFFSET = 20;

export interface SignerEntry {
  account: string;
  weight: number;
}

export interface SetupSignerListParams {
  fundWalletSeed: string;
  signerEntries: SignerEntry[];
  signerQuorum: number;
}

export interface SetupSignerListResult {
  txHash: string;
  signerQuorum: number;
  signerCount: number;
}

export interface AddSignerParams {
  fundWalletSeed: string;
  newSigner: SignerEntry;
  newQuorum?: number;
}

export interface RemoveSignerParams {
  fundWalletSeed: string;
  signerAddress: string;
  newQuorum?: number;
}

function validateAddress(address: string, label: string): void {
  if (!isValidClassicAddress(address)) {
    throw new Error(`Invalid ${label} address: ${address}`);
  }
}

function validateSignerEntries(entries: SignerEntry[]): void {
  if (entries.length === 0) {
    throw new Error("Signer list must have at least one entry");
  }
  if (entries.length > 32) {
    throw new Error("Signer list cannot exceed 32 entries");
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    validateAddress(entry.account, "signer");
    if (entry.weight < 1 || entry.weight > 65535) {
      throw new Error(
        `Signer weight must be between 1 and 65535, got: ${entry.weight}`
      );
    }
    if (seen.has(entry.account)) {
      throw new Error(`Duplicate signer address: ${entry.account}`);
    }
    seen.add(entry.account);
  }
}

function validateQuorum(quorum: number, entries: SignerEntry[]): void {
  if (!Number.isInteger(quorum) || quorum < 1) {
    throw new Error(`Quorum must be a positive integer, got: ${quorum}`);
  }
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  if (quorum > totalWeight) {
    throw new Error(
      `Quorum (${quorum}) cannot exceed total signer weight (${totalWeight})`
    );
  }
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

function buildSignerListSetTx(
  account: string,
  entries: SignerEntry[],
  quorum: number
): SignerListSet {
  return {
    TransactionType: "SignerListSet",
    Account: account,
    SignerQuorum: quorum,
    SignerEntries: entries.map((e) => ({
      SignerEntry: {
        Account: e.account,
        SignerWeight: e.weight,
      },
    })),
  };
}

export async function setupSignerList(
  params: SetupSignerListParams
): Promise<SetupSignerListResult> {
  validateSignerEntries(params.signerEntries);
  validateQuorum(params.signerQuorum, params.signerEntries);

  const wallet = Wallet.fromSeed(params.fundWalletSeed);
  validateAddress(wallet.address, "fund wallet");

  for (const entry of params.signerEntries) {
    if (entry.account === wallet.address) {
      throw new Error("Fund wallet cannot be its own signer");
    }
  }

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx = buildSignerListSetTx(
    wallet.address,
    params.signerEntries,
    params.signerQuorum
  );
  tx.LastLedgerSequence = currentLedger + LEDGER_OFFSET;

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = getTransactionResult(result.result.meta);
  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`SignerListSet failed: ${txResult}`);
  }

  return {
    txHash: result.result.hash,
    signerQuorum: params.signerQuorum,
    signerCount: params.signerEntries.length,
  };
}

export async function addSigner(
  params: AddSignerParams
): Promise<SetupSignerListResult> {
  validateAddress(params.newSigner.account, "new signer");

  const wallet = Wallet.fromSeed(params.fundWalletSeed);
  validateAddress(wallet.address, "fund wallet");

  if (params.newSigner.account === wallet.address) {
    throw new Error("Fund wallet cannot be its own signer");
  }

  const existing = await getSignerList(wallet.address);
  if (!existing) {
    throw new Error(
      "No existing signer list found. Use setupSignerList first."
    );
  }

  const alreadyExists = existing.signerEntries.some(
    (e) => e.account === params.newSigner.account
  );
  if (alreadyExists) {
    throw new Error(
      `Signer ${params.newSigner.account} is already on the signer list`
    );
  }

  const updatedEntries: SignerEntry[] = [
    ...existing.signerEntries.map((e) => ({
      account: e.account,
      weight: e.signerWeight,
    })),
    params.newSigner,
  ];

  const newQuorum = params.newQuorum ?? existing.signerQuorum;
  validateSignerEntries(updatedEntries);
  validateQuorum(newQuorum, updatedEntries);

  return setupSignerList({
    fundWalletSeed: params.fundWalletSeed,
    signerEntries: updatedEntries,
    signerQuorum: newQuorum,
  });
}

export async function removeSigner(
  params: RemoveSignerParams
): Promise<SetupSignerListResult> {
  validateAddress(params.signerAddress, "signer to remove");

  const wallet = Wallet.fromSeed(params.fundWalletSeed);
  validateAddress(wallet.address, "fund wallet");

  const existing = await getSignerList(wallet.address);
  if (!existing) {
    throw new Error("No existing signer list found");
  }

  const updatedEntries: SignerEntry[] = existing.signerEntries
    .filter((e) => e.account !== params.signerAddress)
    .map((e) => ({
      account: e.account,
      weight: e.signerWeight,
    }));

  if (updatedEntries.length === existing.signerEntries.length) {
    throw new Error(
      `Signer ${params.signerAddress} not found on the signer list`
    );
  }

  if (updatedEntries.length === 0) {
    throw new Error("Cannot remove the last signer from the list");
  }

  const newQuorum = params.newQuorum ?? existing.signerQuorum;
  validateQuorum(newQuorum, updatedEntries);

  return setupSignerList({
    fundWalletSeed: params.fundWalletSeed,
    signerEntries: updatedEntries,
    signerQuorum: newQuorum,
  });
}

export function combineSignatures(signedTxBlobs: string[]): string {
  if (signedTxBlobs.length === 0) {
    throw new Error("At least one signed transaction blob is required");
  }
  return multisign(signedTxBlobs);
}

export interface SubmitMultiSignedResult {
  txHash: string;
  resultCode: string;
}

export async function submitMultiSigned(
  multiSignedTxBlob: string
): Promise<SubmitMultiSignedResult> {
  const client = await getClient();
  const result = await client.submitAndWait(multiSignedTxBlob);

  const txResult = getTransactionResult(result.result.meta);
  const resultCode = txResult ?? "unknown";

  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`Multi-signed transaction failed: ${txResult}`);
  }

  return {
    txHash: result.result.hash,
    resultCode,
  };
}

export function signForMultiSign(
  tx: Transaction,
  signerSeed: string
): string {
  const wallet = Wallet.fromSeed(signerSeed);
  const signed = wallet.sign(tx, true);
  return signed.tx_blob;
}
