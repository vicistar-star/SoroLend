import { createReducer, on } from '@ngrx/store';

import { Market } from '../../core/models/protocol.models';
import * as MarketsActions from './markets.actions';

export interface MarketsState {
  markets: Market[];
  loading: boolean;
  error: string | null;
}

export const initialMarketsState: MarketsState = {
  markets: [],
  loading: false,
  error: null
};

export const marketsReducer = createReducer(
  initialMarketsState,
  on(MarketsActions.loadMarkets, (state) => ({ ...state, loading: true, error: null })),
  on(MarketsActions.loadMarketsSuccess, (state, { markets }) => ({ ...state, markets, loading: false })),
  on(MarketsActions.loadMarketsFailure, (state, { error }) => ({ ...state, loading: false, error }))
);
