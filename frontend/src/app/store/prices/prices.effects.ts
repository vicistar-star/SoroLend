import { Injectable } from '@angular/core';
import { Actions, createEffect } from '@ngrx/effects';
import { map } from 'rxjs';

import { NotificationService } from '../../core/services/notification.service';
import * as PricesActions from './prices.actions';

@Injectable()
export class PricesEffects {
  priceStream$ = createEffect(() =>
    this.notifications.onEvent<Record<string, number>>('price:update').pipe(
      map((prices) => PricesActions.priceStreamUpdated({ prices }))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly notifications: NotificationService
  ) {
    void this.actions$;
  }
}
