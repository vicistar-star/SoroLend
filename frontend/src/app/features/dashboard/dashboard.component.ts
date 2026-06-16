import { AsyncPipe, CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';

import { HealthFactorBadgeComponent } from '../../shared/health-factor-badge/health-factor-badge.component';
import { selectWalletAddress } from '../../store/auth/auth.selectors';
import * as PortfolioActions from '../../store/portfolio/portfolio.actions';
import { selectBorrowPositions, selectCollateralPortfolio, selectHealthFactor, selectNetApy, selectProtocolStats, selectSupplyPositions } from '../../store/portfolio/portfolio.selectors';

@Component({
  selector: 'sl-dashboard',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, HealthFactorBadgeComponent, PercentPipe],
  template: `
    <section class="page">
      <div class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Portfolio health, market exposure, and protocol activity.</p>
        </div>
        <sl-health-factor-badge [healthFactor]="healthFactor()" />
      </div>

      <div class="grid">
        <article class="panel">
          <span class="muted">Collateral Value</span>
          <strong class="value">{{ collateralValue() | currency }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Supply APY</span>
          <strong class="value">{{ supplyApy() | percent: '1.2-2' }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Borrow APY</span>
          <strong class="value">{{ borrowApy() | percent: '1.2-2' }}</strong>
        </article>
      </div>

      <div class="grid">
        <article class="panel">
          <span class="muted">Liquidation Price</span>
          <strong class="value">{{ liquidationPrice() | currency }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Available Borrow</span>
          <strong class="value">{{ availableBorrow() | currency }}</strong>
        </article>
        <article class="panel">
          <span class="muted">Protocol TVL</span>
          <strong class="value">{{ ((stats$ | async)?.tvlUsd ?? 0) | currency }}</strong>
        </article>
      </div>

      <article class="panel">
        <h2>Positions</h2>
        @for (position of supply$ | async; track position.id ?? position.assetCode) {
          <div class="position-row"><span>Supplied {{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
        }
        @for (position of borrow$ | async; track position.id ?? position.assetCode) {
          <div class="position-row"><span>Borrowed {{ position.assetCode }}</span><strong>{{ position.amount | number }}</strong></div>
        }
      </article>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly address = toSignal(this.store.select(selectWalletAddress), { initialValue: null });
  private readonly collateral = toSignal(this.store.select(selectCollateralPortfolio), {
    initialValue: { positions: [], totalValueUsd: 0, availableBorrowUsd: 0, healthFactor: Number.POSITIVE_INFINITY }
  });
  private readonly netApy = toSignal(this.store.select(selectNetApy), { initialValue: 0 });
  private readonly health = toSignal(this.store.select(selectHealthFactor), { initialValue: Number.POSITIVE_INFINITY });

  readonly supply$ = this.store.select(selectSupplyPositions);
  readonly borrow$ = this.store.select(selectBorrowPositions);
  readonly stats$ = this.store.select(selectProtocolStats);

  readonly healthFactor = computed(() => this.health());
  readonly collateralValue = computed(() => this.collateral().totalValueUsd);
  readonly availableBorrow = computed(() => this.collateral().availableBorrowUsd);
  readonly supplyApy = computed(() => Math.max(this.netApy(), 0.042));
  readonly borrowApy = computed(() => 0.071);
  readonly liquidationPrice = computed(() => {
    const health = this.healthFactor();
    return Number.isFinite(health) && health > 0 ? this.collateralValue() / health : 0;
  });

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    const address = this.address();
    if (address) {
      this.store.dispatch(PortfolioActions.loadPortfolio({ address }));
    }
  }
}
