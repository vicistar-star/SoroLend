import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { HealthFactorBadgeComponent } from '../../shared/health-factor-badge/health-factor-badge.component';
import { selectWalletAddress } from '../../store/auth/auth.selectors';
import { selectMarkets } from '../../store/markets/markets.selectors';
import * as PortfolioActions from '../../store/portfolio/portfolio.actions';
import { selectBorrowPositions, selectHealthFactor, selectMaxBorrowUsd, selectTransactionPending } from '../../store/portfolio/portfolio.selectors';

@Component({
  selector: 'sl-borrowing',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, HealthFactorBadgeComponent, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Borrowing</h1>
          <p class="muted">Borrow against collateral, repay debt, and monitor risk.</p>
        </div>
        <sl-health-factor-badge [healthFactor]="(healthFactor$ | async) ?? 999" />
      </div>

      <article class="panel">
        <div class="metric"><span>Max Borrow</span><strong>{{ (maxBorrow$ | async) ?? 0 | currency }}</strong></div>
        @for (position of positions$ | async; track position.id ?? position.assetCode) {
          <div class="position-row"><span>{{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
        }
      </article>

      <form class="panel" [formGroup]="form" (ngSubmit)="submit('borrow')">
        <h2>Borrow / Repay</h2>
        <div class="form-grid">
          <select formControlName="assetCode">
            @for (market of markets$ | async; track market.id) {
              <option [value]="market.code">{{ market.code }}</option>
            }
          </select>
          <input formControlName="amount" inputmode="decimal" placeholder="Amount" />
          <button type="submit" [disabled]="form.invalid || (pending$ | async)">Borrow</button>
        </div>
        <button type="button" [disabled]="form.invalid || (pending$ | async)" (click)="submit('repay')">Repay</button>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BorrowingComponent {
  readonly markets$ = this.store.select(selectMarkets);
  readonly positions$ = this.store.select(selectBorrowPositions);
  readonly healthFactor$ = this.store.select(selectHealthFactor);
  readonly maxBorrow$ = this.store.select(selectMaxBorrowUsd);
  readonly pending$ = this.store.select(selectTransactionPending);

  readonly form = this.fb.nonNullable.group({
    assetCode: ['USDC', Validators.required],
    amount: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]]
  });

  private currentAddress: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store
  ) {
    this.store.select(selectWalletAddress).subscribe((address) => (this.currentAddress = address));
  }

  submit(kind: 'borrow' | 'repay'): void {
    if (!this.currentAddress || this.form.invalid) {
      return;
    }
    this.store.dispatch(PortfolioActions.submitTransaction({ kind, address: this.currentAddress, ...this.form.getRawValue() }));
  }
}
