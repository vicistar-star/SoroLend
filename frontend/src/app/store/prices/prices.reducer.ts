import { createReducer, on } from '@ngrx/store';

import * as PricesActions from './prices.actions';

export interface PricesState {
  prices: Record<string, number>;
}

export const initialPricesState: PricesState = { prices: {} };

export const pricesReducer = createReducer(
  initialPricesState,
  on(PricesActions.priceStreamUpdated, (state, { prices }) => ({ ...state, prices: { ...state.prices, ...prices } }))
);
