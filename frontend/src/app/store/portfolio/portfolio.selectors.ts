import { createFeatureSelector, createSelector } from '@ngrx/store';

import { PortfolioState } from './portfolio.reducer';

export const selectPortfolioState = createFeatureSelector<PortfolioState>('portfolio');
export const selectSupplyPositions = createSelector(selectPortfolioState, (state) => state.supply);
export const selectBorrowPositions = createSelector(selectPortfolioState, (state) => state.borrow);
export const selectCollateralPortfolio = createSelector(selectPortfolioState, (state) => state.collateral);
export const selectHealthFactor = createSelector(selectPortfolioState, (state) => state.healthFactor);
export const selectMaxBorrowUsd = createSelector(selectPortfolioState, (state) => state.maxBorrowUsd);
export const selectProtocolStats = createSelector(selectPortfolioState, (state) => state.stats);
export const selectPortfolioLoading = createSelector(selectPortfolioState, (state) => state.loading);
export const selectTransactionPending = createSelector(selectPortfolioState, (state) => state.transactionPending);
export const selectPortfolioError = createSelector(selectPortfolioState, (state) => state.error);
export const selectNetApy = createSelector(selectSupplyPositions, selectBorrowPositions, (supply, borrow) => {
  const supplied = supply.reduce((total, position) => total + Number(position.amount || 0), 0);
  const borrowed = borrow.reduce((total, position) => total + Number(position.amount || 0), 0);
  if (supplied === 0 && borrowed === 0) {
    return 0;
  }
  return ((supplied * 0.042) - (borrowed * 0.071)) / Math.max(supplied + borrowed, 1);
});
