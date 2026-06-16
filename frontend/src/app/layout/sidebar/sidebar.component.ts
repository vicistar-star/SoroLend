import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import * as MarketsActions from '../../store/markets/markets.actions';
import { selectMarkets } from '../../store/markets/markets.selectors';

@Component({
  selector: 'sl-sidebar',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe],
  template: `
    <aside class="sidebar">
      <h2>Markets</h2>
      @for (market of markets$ | async; track market.id) {
        <div class="market-row">
          <strong>{{ market.code }}</strong>
          <span>{{ market.oraclePrice | number: '1.2-6' }}</span>
        </div>
      } @empty {
        <div class="muted">No markets loaded</div>
      }
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit {
  readonly markets$ = this.store.select(selectMarkets);

  constructor(private readonly store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(MarketsActions.loadMarkets());
  }
}
