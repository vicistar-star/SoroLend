import { AsyncPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { selectWalletAddress } from '../../store/auth/auth.selectors';
import { selectMarkets, selectMarketsError, selectMarketsLoading } from '../../store/markets/markets.selectors';
import * as PortfolioActions from '../../store/portfolio/portfolio.actions';
import { selectPortfolioError, selectTransactionPending } from '../../store/portfolio/portfolio.selectors';

@Component({
  selector: 'sl-lending',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, PercentPipe, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Lending</h1>
          <p class="muted">Supply assets to earn APY or withdraw available liquidity.</p>
        </div>
        @if (pending$ | async) {
          <strong class="muted">Transaction pending</strong>
        }
      </div>

      <article class="panel">
        <h2>Markets</h2>
        @if (loading$ | async) {
          <p class="muted">Loading markets...</p>
        }
        @for (market of markets$ | async; track market.id) {
          <div class="position-row">
            <strong>{{ market.code }}</strong>
            <span>Supply {{ market.supplyApy ?? 0.042 | percent: '1.2-2' }}</span>
            <span>Borrow {{ market.borrowApy ?? 0.071 | percent: '1.2-2' }}</span>
          </div>
        }
      </article>

      <form class="panel" [formGroup]="form" (ngSubmit)="submit('supply')">
        <h2>Supply / Withdraw</h2>
        <div class="form-grid">
          <select formControlName="assetCode" aria-label="Asset">
            @for (market of markets$ | async; track market.id) {
              <option [value]="market.code">{{ market.code }}</option>
            }
          </select>
          <input formControlName="amount" inputmode="decimal" placeholder="Amount" />
          <button type="submit" [disabled]="form.invalid || (pending$ | async)">Supply</button>
        </div>
        <button type="button" [disabled]="form.invalid || (pending$ | async)" (click)="submit('withdraw')">Withdraw</button>
      </form>

      @if ((marketError$ | async) || (portfolioError$ | async); as error) {
        <p class="inline-error">{{ error }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LendingComponent {
  readonly markets$ = this.store.select(selectMarkets);
  readonly loading$ = this.store.select(selectMarketsLoading);
  readonly marketError$ = this.store.select(selectMarketsError);
  readonly portfolioError$ = this.store.select(selectPortfolioError);
  readonly pending$ = this.store.select(selectTransactionPending);
  readonly address$ = this.store.select(selectWalletAddress);

  readonly form = this.fb.nonNullable.group({
    assetCode: ['XLM', Validators.required],
    amount: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]]
  });

  private currentAddress: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store
  ) {
    this.address$.subscribe((address) => (this.currentAddress = address));
  }

  submit(kind: 'supply' | 'withdraw'): void {
    if (!this.currentAddress || this.form.invalid) {
      return;
    }
    this.store.dispatch(PortfolioActions.submitTransaction({ kind, address: this.currentAddress, ...this.form.getRawValue() }));
  }
}
