declare module "xrpl-connect" {
  export interface WalletAccount {
    address: string;
    network?: string;
    publicKey?: string;
  }

  export interface SignedTransaction {
    tx_blob: string;
    hash?: string;
    signature?: string;
    id?: string;
  }

  export interface WalletAdapterInfo {
    id: string;
    name: string;
  }

  export interface WalletManagerOptions {
    adapters: unknown[];
    network?: string;
    autoConnect?: boolean;
  }

  export class WalletManager {
    constructor(options: WalletManagerOptions);

    get connected(): boolean;
    get account(): WalletAccount | null;
    get wallets(): WalletAdapterInfo[];

    connect(walletId: string): Promise<WalletAccount>;
    disconnect(): Promise<void>;
    reconnect(): Promise<WalletAccount | null>;
    sign(transaction: Record<string, unknown>): Promise<SignedTransaction>;
    signAndSubmit(
      transaction: Record<string, unknown>
    ): Promise<SignedTransaction>;

    on(event: "connect", handler: (account: WalletAccount) => void): void;
    on(event: "disconnect", handler: () => void): void;
    on(
      event: "accountChanged",
      handler: (account: WalletAccount) => void
    ): void;
    on(event: "networkChanged", handler: (network: string) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
  }

  export class GemWalletAdapter {}
  export class XamanAdapter {}
  export class CrossmarkAdapter {}
  export class LedgerAdapter {}
  export class WalletConnectAdapter {}
  export class XyraAdapter {}

  export class WalletError extends Error {
    code: string;
  }
  export const WalletErrorCode: Record<string, string>;
  export const Adapters: Record<string, unknown>;
  export const STANDARD_NETWORKS: Record<string, unknown>;

  export class LocalStorageAdapter {}
  export class MemoryStorageAdapter {}
  export class Storage {}
  export class Logger {}

  export function createLogger(options?: unknown): Logger;
  export function createWalletError(code: string, message: string): WalletError;
  export function getErrorMessage(error: unknown): string;
  export function isWalletError(error: unknown): error is WalletError;
  export function isMobile(): boolean;
  export function truncateString(str: string, length?: number): string;
  export function delay(ms: number): Promise<void>;
}
