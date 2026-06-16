import { createFeatureSelector, createSelector } from '@ngrx/store';

import { PricesState } from './prices.reducer';

export const selectPricesState = createFeatureSelector<PricesState>('prices');
export const selectPrices = createSelector(selectPricesState, (state) => state.prices);
