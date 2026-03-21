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
