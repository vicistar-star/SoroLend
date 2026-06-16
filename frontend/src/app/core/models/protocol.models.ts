export interface WalletState {
  address: string | null;
  jwt: string | null;
  connected: boolean;
}

export interface Market {
  id: string;
  code: string;
  decimals: number;
  oraclePrice: string;
  ltvRatio: string;
  liquidationThreshold: string;
  liquidationPenalty: string;
  reserveFactor: string;
  isActive: boolean;
  supplyApy?: number;
  borrowApy?: number;
  liquidity?: string;
}

export interface Position {
  id?: string;
  assetCode: string;
  amount: string;
  shares?: string;
  supplyIndex?: string;
  debtIndex?: string;
  assetDecimals?: number;
}

export interface CollateralPortfolio {
  positions: Position[];
  totalValueUsd: number;
  availableBorrowUsd: number;
  healthFactor: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'Pending' | 'Active' | 'Succeeded' | 'Defeated' | 'Executed';
  forVotes: string;
  againstVotes: string;
  createdBy?: string;
}

export interface ProtocolStats {
  tvlUsd: number;
  totalBorrowsUsd: number;
  activeUsers: number;
  liquidationVolumeUsd: number;
}

export interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}
