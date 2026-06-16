import { AsyncPipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';

import { HealthFactorBadgeComponent } from '../../shared/health-factor-badge/health-factor-badge.component';
import { selectWalletAddress } from '../../store/auth/auth.selectors';
import { selectMarkets } from '../../store/markets/markets.selectors';
import * as PortfolioActions from '../../store/portfolio/portfolio.actions';
import { selectCollateralPortfolio, selectHealthFactor, selectMaxBorrowUsd, selectTransactionPending } from '../../store/portfolio/portfolio.selectors';

@Component({
  selector: 'sl-collateral',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, HealthFactorBadgeComponent, ReactiveFormsModule],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Collateral</h1>
          <p class="muted">Manage backing assets and available borrowing power.</p>
        </div>
        <sl-health-factor-badge [healthFactor]="(healthFactor$ | async) ?? 999" />
      </div>

      <div class="grid">
        <article class="panel">
          <span class="muted">Collateral</span>
          <strong class="value">{{ ((portfolio$ | async)?.totalValueUsd ?? 0) | currency }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Available to Borrow</span>
          <strong class="value">{{ ((maxBorrow$ | async) ?? 0) | currency }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Borrow Gauge</span>
          <progress max="100" [value]="gaugeValue((maxBorrow$ | async) ?? 0, ((portfolio$ | async)?.totalValueUsd ?? 0))"></progress>
        </article>
      </div>

      <article class="panel">
        <h2>Breakdown</h2>
        @for (position of (portfolio$ | async)?.positions ?? []; track position.id ?? position.assetCode) {
          <div class="position-row"><span>{{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
        }
      </article>

      <form class="panel" [formGroup]="form" (ngSubmit)="submit('depositCollateral')">
        <h2>Deposit / Withdraw</h2>
        <div class="form-grid">
          <select formControlName="assetCode">
            @for (market of markets$ | async; track market.id) {
              <option [value]="market.code">{{ market.code }}</option>
            }
          </select>
          <input formControlName="amount" inputmode="decimal" placeholder="Amount" />
          <button type="submit" [disabled]="form.invalid || (pending$ | async)">Deposit</button>
        </div>
        <button type="button" [disabled]="form.invalid || (pending$ | async)" (click)="submit('withdrawCollateral')">Withdraw</button>
      </form>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollateralComponent {
  readonly markets$ = this.store.select(selectMarkets);
  readonly portfolio$ = this.store.select(selectCollateralPortfolio);
  readonly healthFactor$ = this.store.select(selectHealthFactor);
  readonly maxBorrow$ = this.store.select(selectMaxBorrowUsd);
  readonly pending$ = this.store.select(selectTransactionPending);

  readonly form = this.fb.nonNullable.group({
    assetCode: ['XLM', Validators.required],
    amount: ['', [Validators.required, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)]]
  });

  private currentAddress: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly store: Store
  ) {
    this.store.select(selectWalletAddress).subscribe((address) => (this.currentAddress = address));
  }

  gaugeValue(maxBorrow: number, collateral: number): number {
    return collateral > 0 ? Math.min(100, (maxBorrow / collateral) * 100) : 0;
  }

  submit(kind: 'depositCollateral' | 'withdrawCollateral'): void {
    if (!this.currentAddress || this.form.invalid) {
      return;
    }
    this.store.dispatch(PortfolioActions.submitTransaction({ kind, address: this.currentAddress, ...this.form.getRawValue() }));
  }
}
