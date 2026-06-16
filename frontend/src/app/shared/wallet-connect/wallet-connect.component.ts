import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../store/auth/auth.actions';
import { selectAuthError, selectAuthLoading, selectIsConnected, selectWalletAddress } from '../../store/auth/auth.selectors';

@Component({
  selector: 'sl-wallet-connect',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <button class="wallet-button" type="button" [disabled]="loading$ | async" (click)="connect()">
      <span>{{ (connected$ | async) ? shortAddress(address$ | async) : 'Connect Freighter' }}</span>
    </button>
    @if (error$ | async; as error) {
      <p class="inline-error">{{ error }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletConnectComponent {
  readonly address$ = this.store.select(selectWalletAddress);
  readonly connected$ = this.store.select(selectIsConnected);
  readonly loading$ = this.store.select(selectAuthLoading);
  readonly error$ = this.store.select(selectAuthError);

  constructor(private readonly store: Store) {}

  connect(): void {
    this.store.dispatch(AuthActions.connectWallet());
  }

  shortAddress(address: string | null): string {
    return address ? `${address.slice(0, 5)}...${address.slice(-5)}` : 'Connect Freighter';
  }
}
