import { createReducer, on } from '@ngrx/store';

import { CollateralPortfolio, Position, ProtocolStats } from '../../core/models/protocol.models';
import * as PortfolioActions from './portfolio.actions';

export interface PortfolioState {
  supply: Position[];
  borrow: Position[];
  collateral: CollateralPortfolio;
  healthFactor: number;
  maxBorrowUsd: number;
  stats: ProtocolStats | null;
  loading: boolean;
  transactionPending: boolean;
  error: string | null;
}

export const emptyCollateral: CollateralPortfolio = {
  positions: [],
  totalValueUsd: 0,
  availableBorrowUsd: 0,
  healthFactor: Number.POSITIVE_INFINITY
};

export const initialPortfolioState: PortfolioState = {
  supply: [],
  borrow: [],
  collateral: emptyCollateral,
  healthFactor: Number.POSITIVE_INFINITY,
  maxBorrowUsd: 0,
  stats: null,
  loading: false,
  transactionPending: false,
  error: null
};

export const portfolioReducer = createReducer(
  initialPortfolioState,
  on(PortfolioActions.loadPortfolio, (state) => ({ ...state, loading: true, error: null })),
  on(PortfolioActions.loadPortfolioSuccess, (state, payload) => ({
    ...state,
    ...payload,
    loading: false,
    transactionPending: false,
    error: null
  })),
  on(PortfolioActions.loadPortfolioFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(PortfolioActions.submitTransaction, (state) => ({ ...state, transactionPending: true, error: null })),
  on(PortfolioActions.submitTransactionSuccess, (state) => ({ ...state, transactionPending: false })),
  on(PortfolioActions.submitTransactionFailure, (state, { error }) => ({ ...state, transactionPending: false, error }))
);
