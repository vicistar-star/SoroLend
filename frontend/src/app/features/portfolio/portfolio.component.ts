import { AsyncPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { selectBorrowPositions, selectCollateralPortfolio, selectNetApy, selectSupplyPositions } from '../../store/portfolio/portfolio.selectors';

@Component({
  selector: 'sl-portfolio',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, PercentPipe],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Portfolio</h1>
          <p class="muted">Consolidated supply, borrow, and collateral exposure.</p>
        </div>
        <strong class="value">{{ (netApy$ | async) ?? 0 | percent: '1.2-2' }}</strong>
      </div>

      <div class="grid">
        <article class="panel">
          <h2>Supply</h2>
          @for (position of supply$ | async; track position.id ?? position.assetCode) {
            <div class="position-row"><span>{{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
          }
        </article>
        <article class="panel">
          <h2>Borrow</h2>
          @for (position of borrow$ | async; track position.id ?? position.assetCode) {
            <div class="position-row"><span>{{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
          }
        </article>
        <article class="panel">
          <h2>Collateral</h2>
          @for (position of (collateral$ | async)?.positions ?? []; track position.id ?? position.assetCode) {
            <div class="position-row"><span>{{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
          }
        </article>
      </div>

      <article class="panel">
        <h2>Historical Performance</h2>
        <div class="chart-stub" aria-label="Historical performance chart placeholder">
          @for (height of bars; track $index) {
            <span [style.height.%]="height"></span>
          }
        </div>
      </article>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PortfolioComponent {
  readonly supply$ = this.store.select(selectSupplyPositions);
  readonly borrow$ = this.store.select(selectBorrowPositions);
  readonly collateral$ = this.store.select(selectCollateralPortfolio);
  readonly netApy$ = this.store.select(selectNetApy);
  readonly bars = [28, 34, 31, 42, 48, 45, 52, 58, 63, 61, 68, 74];

  constructor(private readonly store: Store) {}
}
