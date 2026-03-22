export {
  getClient,
  disconnectClient,
  isClientConnected,
  getXrplUrl,
  getNetworkId,
  withClient,
} from "./client";

export {
  getBalance,
  getAccountInfo,
  getTxHistory,
  getSignerList,
  getAvailableBalance,
  getEscrows,
  getNFTs,
  accountExists,
  getAccountSequence,
  getLedgerIndex,
  getServerFee,
  getOwnerCount,
  calculateReserve,
  isValidAddress,
} from "./account";

export type {
  SignerEntryInfo,
  SignerListInfo,
  TxHistoryEntry,
  EscrowInfo,
  NFTokenInfo,
} from "./account";

export {
  createTestnetWallet,
  walletFromSeed,
  generateWallet,
  fundExistingWallet,
  getWalletInfo,
  createFundWalletWithInfo,
} from "./faucet";

export type { FaucetResult, WalletInfo } from "./faucet";

export {
  generateConditionAndFulfillment,
  verifyConditionFulfillment,
  extractPreimage,
  conditionFromPreimage,
  fulfillmentFromPreimage,
  isValidConditionHex,
  isValidFulfillmentHex,
} from "./conditions";

export type {
  ConditionFulfillment,
  ConditionFulfillmentWithPreimage,
} from "./conditions";

export {
  buildContributionTx,
  buildReleaseTx,
  buildMemo,
  canAffordContribution,
  calculateMultiSignFee,
  BASE_FEE_DROPS,
  toHex,
  fromHex,
  decodeMemos,
  isContributionMemo,
  isReleaseMemo,
  extractMemoId,
  MEMO_TYPES,
} from "./payment";

export type {
  ContributionTxParams,
  ReleaseTxParams,
  MemoData,
} from "./payment";

export {
  createEscrow,
  buildEscrowFinishTx,
  cancelEscrow,
  canCreateEscrow,
  rippleTimeToUnix,
  rippleTimeToDate,
  isEscrowExpired,
  getEscrowTimeRemaining,
  calculateEscrowExpiry,
} from "./escrow";

export type {
  CreateEscrowParams,
  CreateEscrowResult,
  BuildEscrowFinishParams,
  CancelEscrowParams,
  CancelEscrowResult,
} from "./escrow";

export {
  setupSignerList,
  addSigner,
  removeSigner,
  combineSignatures,
  submitMultiSigned,
  signForMultiSign,
} from "./multisig";

export type {
  SignerEntry,
  SetupSignerListParams,
  SetupSignerListResult,
  AddSignerParams,
  RemoveSignerParams,
  SubmitMultiSignedResult,
} from "./multisig";

export {
  mintMembershipNFT,
  verifyMembership,
  burnMembershipNFT,
} from "./nft";

export type {
  MintMembershipNFTParams,
  MintMembershipNFTResult,
  BurnMembershipNFTParams,
  BurnMembershipNFTResult,
} from "./nft";
