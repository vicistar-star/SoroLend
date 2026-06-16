import { createFeatureSelector, createSelector } from '@ngrx/store';

import { MarketsState } from './markets.reducer';

export const selectMarketsState = createFeatureSelector<MarketsState>('markets');
export const selectMarkets = createSelector(selectMarketsState, (state) => state.markets);
export const selectMarketsLoading = createSelector(selectMarketsState, (state) => state.loading);
export const selectMarketsError = createSelector(selectMarketsState, (state) => state.error);
