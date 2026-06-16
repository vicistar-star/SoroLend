import { createAction, props } from '@ngrx/store';

import { Market } from '../../core/models/protocol.models';

export const loadMarkets = createAction('[Markets] Load Markets');
export const loadMarketsSuccess = createAction('[Markets] Load Markets Success', props<{ markets: Market[] }>());
export const loadMarketsFailure = createAction('[Markets] Load Markets Failure', props<{ error: string }>());
