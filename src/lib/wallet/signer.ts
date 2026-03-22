"use client";

import { Wallet, type Transaction } from "xrpl";

const SIGNER_STORAGE_KEY = "pulse:signers";

interface StoredSigner {
  fundId: string;
  seed: string;
  address: string;
  publicKey: string;
}

function getStoredSigners(): StoredSigner[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SIGNER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSigner[]) : [];
  } catch {
    return [];
  }
}

function saveStoredSigners(signers: StoredSigner[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SIGNER_STORAGE_KEY, JSON.stringify(signers));
}

export interface SignerKeypair {
  address: string;
  publicKey: string;
  seed: string;
}

/**
 * Generate a new signer keypair for a fund and store it in localStorage.
 * If a keypair already exists for this fund, returns the existing one.
 */
export function generateSignerKeypair(fundId: string): SignerKeypair {
  const existing = getSignerForFund(fundId);
  if (existing) {
    return existing;
  }

  const wallet = Wallet.generate();
  const signer: StoredSigner = {
    fundId,
    seed: wallet.seed!,
    address: wallet.address,
    publicKey: wallet.publicKey,
  };

  const signers = getStoredSigners();
  signers.push(signer);
  saveStoredSigners(signers);

  return {
    address: wallet.address,
    publicKey: wallet.publicKey,
    seed: wallet.seed!,
  };
}

/**
 * Get the signer keypair for a specific fund from localStorage.
 */
export function getSignerForFund(fundId: string): SignerKeypair | null {
  const signers = getStoredSigners();
  const match = signers.find((s) => s.fundId === fundId);
  if (!match) return null;

  return {
    address: match.address,
    publicKey: match.publicKey,
    seed: match.seed,
  };
}

/**
 * Get the signer address for a specific fund (convenience shorthand).
 */
export function getSignerAddress(fundId: string): string | null {
  return getSignerForFund(fundId)?.address ?? null;
}

/**
 * Multi-sign a transaction using the signer keypair for a fund.
 * Uses wallet.sign(tx, true) to produce the correct multi-sign blob format.
 */
export function multiSignTransaction(
  fundId: string,
  tx: Transaction
): string {
  const signer = getSignerForFund(fundId);
  if (!signer) {
    throw new Error(
      `No signer keypair found for fund ${fundId}. Join the fund first.`
    );
  }

  const wallet = Wallet.fromSeed(signer.seed);
  const signed = wallet.sign(tx, true);
  return signed.tx_blob;
}

/**
 * Remove the signer keypair for a specific fund from localStorage.
 */
export function removeSignerForFund(fundId: string): boolean {
  const signers = getStoredSigners();
  const filtered = signers.filter((s) => s.fundId !== fundId);
  if (filtered.length === signers.length) return false;

  saveStoredSigners(filtered);
  return true;
}

/**
 * Get all fund IDs for which signer keypairs exist.
 */
export function getSignedFundIds(): string[] {
  return getStoredSigners().map((s) => s.fundId);
}
