import { createAction, props } from '@ngrx/store';

import { CollateralPortfolio, Position, ProtocolStats } from '../../core/models/protocol.models';

export const loadPortfolio = createAction('[Portfolio] Load Portfolio', props<{ address: string }>());
export const loadPortfolioSuccess = createAction(
  '[Portfolio] Load Portfolio Success',
  props<{
    supply: Position[];
    borrow: Position[];
    collateral: CollateralPortfolio;
    healthFactor: number;
    maxBorrowUsd: number;
    stats: ProtocolStats | null;
  }>()
);
export const loadPortfolioFailure = createAction('[Portfolio] Load Portfolio Failure', props<{ error: string }>());

export const submitTransaction = createAction(
  '[Portfolio] Submit Transaction',
  props<{ kind: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'depositCollateral' | 'withdrawCollateral'; address: string; assetCode: string; amount: string }>()
);
export const submitTransactionSuccess = createAction('[Portfolio] Submit Transaction Success', props<{ address: string }>());
export const submitTransactionFailure = createAction('[Portfolio] Submit Transaction Failure', props<{ error: string }>());
