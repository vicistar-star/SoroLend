import { createAction, props } from '@ngrx/store';

export const priceStreamUpdated = createAction('[Prices] Price Stream Updated', props<{ prices: Record<string, number> }>());
