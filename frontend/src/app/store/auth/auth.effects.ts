import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { WalletService } from '../../core/services/wallet.service';
import * as AuthActions from './auth.actions';

@Injectable()
export class AuthEffects {
  connectWallet$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.connectWallet),
      switchMap(() =>
        from(this.wallet.connect()).pipe(
          map((address) => AuthActions.connectWalletSuccess({ address })),
          catchError((error: Error) => of(AuthActions.connectWalletFailure({ error: error.message })))
        )
      )
    )
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.connectWalletSuccess, AuthActions.login),
      switchMap(({ address }) =>
        this.auth.login(address).pipe(
          map(({ publicKey, jwt }) => AuthActions.loginSuccess({ address: publicKey, jwt })),
          catchError((error: Error) => of(AuthActions.loginFailure({ error: error.message })))
        )
      )
    )
  );

  persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ address, jwt }) => {
          localStorage.setItem('sorolend.address', address);
          localStorage.setItem('sorolend.jwt', jwt);
        })
      ),
    { dispatch: false }
  );

  clear$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          localStorage.removeItem('sorolend.address');
          localStorage.removeItem('sorolend.jwt');
        })
      ),
    { dispatch: false }
  );

  constructor(
    private readonly actions$: Actions,
    private readonly wallet: WalletService,
    private readonly auth: AuthService
  ) {}
}
