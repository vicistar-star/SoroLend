import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';

import { ProtocolApiService } from '../../core/services/protocol-api.service';
import * as PortfolioActions from './portfolio.actions';

@Injectable()
export class PortfolioEffects {
  loadPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.loadPortfolio),
      switchMap(({ address }) =>
        forkJoin({
          supply: this.api.getSupplyPositions(address),
          borrow: this.api.getBorrowPositions(address),
          collateral: this.api.getCollateralPortfolio(address),
          health: this.api.getHealth(address),
          maxBorrow: this.api.getMaxBorrow(address),
          stats: this.api.getProtocolStats().pipe(catchError(() => of(null)))
        }).pipe(
          map(({ supply, borrow, collateral, health, maxBorrow, stats }) =>
            PortfolioActions.loadPortfolioSuccess({
              supply,
              borrow,
              collateral,
              healthFactor: health.healthFactor ?? collateral.healthFactor,
              maxBorrowUsd: maxBorrow.availableBorrowUsd ?? collateral.availableBorrowUsd,
              stats
            })
          ),
          catchError((error: Error) => of(PortfolioActions.loadPortfolioFailure({ error: error.message })))
        )
      )
    )
  );

  submitTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.submitTransaction),
      switchMap(({ kind, address, assetCode, amount }) => {
        const request = {
          supply: this.api.supply(address, assetCode, amount),
          withdraw: this.api.withdraw(address, assetCode, amount),
          borrow: this.api.borrow(address, assetCode, amount),
          repay: this.api.repay(address, assetCode, amount),
          depositCollateral: this.api.depositCollateral(address, assetCode, amount),
          withdrawCollateral: this.api.withdrawCollateral(address, assetCode, amount)
        }[kind];

        return request.pipe(
          map(() => PortfolioActions.submitTransactionSuccess({ address })),
          catchError((error: Error) => of(PortfolioActions.submitTransactionFailure({ error: error.message })))
        );
      })
    )
  );

  refreshAfterTransaction$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PortfolioActions.submitTransactionSuccess),
      map(({ address }) => PortfolioActions.loadPortfolio({ address }))
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly api: ProtocolApiService
  ) {}
}
