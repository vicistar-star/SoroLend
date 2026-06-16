import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'sl-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>SoroLend testnet console</span>
      <span>Real-time lending, borrowing, collateral, and governance</span>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {}
