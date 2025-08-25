export interface NftMetadata {
  mint: string;
  originalOwner: string;
  currentOwner: string;
  metadataUri: string;
  name: string;
  symbol: string;
  crossChainEnabled: boolean;
  isLocked: boolean;
  originChainId: string;
  creationTimestamp: string;
}

export interface CrossChainTransfer {
  mint: string;
  originalOwner: string;
  destinationChainId: string;
  recipientAddress: string;
  nonce: string;
  timestamp: string;
  status: number; // 0: Pending, 1: Completed, 2: Failed
}

export interface CrossChainReceipt {
  originChainId: string;
  originTxHash: string;
  mint: string;
  recipient: string;
  originalOwner: string;
  nonce: string;
  timestamp: string;
  tssSignature: string;
}

export interface ProgramState {
  authority: string;
  isInitialized: boolean;
  totalNftsMinted: string;
  crossChainTransfers: string;
}

export interface CrossChainConfig {
  gatewayAddress: string;
  tssAddress: string;
  chainId: string;
  isPaused: boolean;
  nonceCounter: string;
}

export interface ChainInfo {
  id: number;
  name: string;
  addressLength: number;
  isSupported: boolean;
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: 1, name: "Ethereum", addressLength: 20, isSupported: true },
  { id: 56, name: "BSC", addressLength: 20, isSupported: true },
  { id: 137, name: "Polygon", addressLength: 20, isSupported: true },
  { id: 1001, name: "ZetaChain", addressLength: 20, isSupported: true },
];

export enum TransferStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
}
