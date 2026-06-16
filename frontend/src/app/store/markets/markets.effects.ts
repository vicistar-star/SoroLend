import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import { ProtocolApiService } from '../../core/services/protocol-api.service';
import * as MarketsActions from './markets.actions';

@Injectable()
export class MarketsEffects {
  loadMarkets$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketsActions.loadMarkets),
      switchMap(() =>
        this.api.getMarkets().pipe(
          map((markets) => MarketsActions.loadMarketsSuccess({ markets })),
          catchError((error: Error) => of(MarketsActions.loadMarketsFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly api: ProtocolApiService
  ) {}
}
