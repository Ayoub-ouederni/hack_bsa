import type { NFTokenMint, NFTokenBurn } from "xrpl";
import { Wallet, isValidClassicAddress } from "xrpl";
import { getClient } from "./client";
import { getNFTs } from "./account";
import { toHex } from "./payment";

const LEDGER_OFFSET = 20;

const MEMBERSHIP_TAXON = 1;

// tfBurnable (0x01) — allows issuer to burn the NFT
// NOT setting tfTransferable (0x08) makes it soulbound (non-transferable)
const SOULBOUND_FLAGS = 1;

export interface MintMembershipNFTParams {
  issuerSeed: string;
  recipientAddress: string;
  fundId: string;
}

export interface MintMembershipNFTResult {
  txHash: string;
  nftokenId: string;
}

export interface BurnMembershipNFTParams {
  issuerSeed: string;
  nftokenId: string;
  holderAddress: string;
}

export interface BurnMembershipNFTResult {
  txHash: string;
}

function validateAddress(address: string, label: string): void {
  if (!isValidClassicAddress(address)) {
    throw new Error(`Invalid ${label} address: ${address}`);
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

function extractNFTokenId(meta: unknown): string | null {
  if (typeof meta !== "object" || meta === null) return null;

  const m = meta as Record<string, unknown>;
  if (!Array.isArray(m.AffectedNodes)) return null;

  for (const node of m.AffectedNodes) {
    const n = node as Record<string, unknown>;
    const modified = n.ModifiedNode as Record<string, unknown> | undefined;
    const created = n.CreatedNode as Record<string, unknown> | undefined;

    const fields =
      (modified?.FinalFields as Record<string, unknown>) ??
      (created?.NewFields as Record<string, unknown>);

    if (!fields || !Array.isArray(fields.NFTokens)) continue;

    const prev =
      (modified?.PreviousFields as Record<string, unknown>) ?? null;
    const prevTokens = prev && Array.isArray(prev.NFTokens)
      ? prev.NFTokens
      : [];

    const prevIds = new Set(
      prevTokens.map(
        (t: Record<string, Record<string, string>>) => t.NFToken?.NFTokenID
      )
    );

    for (const token of fields.NFTokens) {
      const t = token as Record<string, Record<string, string>>;
      const id = t.NFToken?.NFTokenID;
      if (id && !prevIds.has(id)) {
        return id;
      }
    }
  }

  return null;
}

export async function mintMembershipNFT(
  params: MintMembershipNFTParams
): Promise<MintMembershipNFTResult> {
  validateAddress(params.recipientAddress, "recipient");

  if (!params.fundId || params.fundId.trim() === "") {
    throw new Error("Fund ID is required");
  }

  const wallet = Wallet.fromSeed(params.issuerSeed);
  validateAddress(wallet.address, "issuer");

  const uri = toHex(`pulse:membership:${params.fundId}`);

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: NFTokenMint = {
    TransactionType: "NFTokenMint",
    Account: wallet.address,
    NFTokenTaxon: MEMBERSHIP_TAXON,
    Flags: SOULBOUND_FLAGS,
    URI: uri,
    LastLedgerSequence: currentLedger + LEDGER_OFFSET,
  };

  // If minting for someone else, set TransferFee to 0 and use Issuer field
  // On XRPL, to mint directly to another account we still mint to ourselves
  // and the NFT stays non-transferable (soulbound)
  // We use NFTokenCreateOffer + NFTokenAcceptOffer pattern for delivery
  // BUT for soulbound tokens, we keep it simple: mint to the fund wallet
  // and track membership via the URI + issuer combination

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = getTransactionResult(result.result.meta);
  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`NFTokenMint failed: ${txResult}`);
  }

  const nftokenId = extractNFTokenId(result.result.meta);
  if (!nftokenId) {
    throw new Error("NFTokenMint succeeded but could not extract NFToken ID from metadata");
  }

  return {
    txHash: result.result.hash,
    nftokenId,
  };
}

export async function verifyMembership(
  issuerAddress: string,
  fundId: string
): Promise<boolean> {
  validateAddress(issuerAddress, "issuer");

  const nfts = await getNFTs(issuerAddress);
  const expectedUri = toHex(`pulse:membership:${fundId}`);

  return nfts.some(
    (nft) =>
      nft.issuer === issuerAddress &&
      nft.taxon === MEMBERSHIP_TAXON &&
      nft.uri === expectedUri
  );
}

export async function burnMembershipNFT(
  params: BurnMembershipNFTParams
): Promise<BurnMembershipNFTResult> {
  validateAddress(params.holderAddress, "holder");

  if (!params.nftokenId || params.nftokenId.trim() === "") {
    throw new Error("NFToken ID is required");
  }

  const wallet = Wallet.fromSeed(params.issuerSeed);
  validateAddress(wallet.address, "issuer");

  const client = await getClient();
  const currentLedger = await client.getLedgerIndex();

  const tx: NFTokenBurn = {
    TransactionType: "NFTokenBurn",
    Account: wallet.address,
    NFTokenID: params.nftokenId,
    LastLedgerSequence: currentLedger + LEDGER_OFFSET,
  };

  // If the holder is different from the issuer, the issuer can still burn
  // because we set tfBurnable flag during mint
  if (params.holderAddress !== wallet.address) {
    (tx as NFTokenBurn & { Owner: string }).Owner = params.holderAddress;
  }

  const prepared = await client.autofill(tx);
  const signed = wallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);

  const txResult = getTransactionResult(result.result.meta);
  if (txResult !== null && txResult !== "tesSUCCESS") {
    throw new Error(`NFTokenBurn failed: ${txResult}`);
  }

  return {
    txHash: result.result.hash,
  };
}
