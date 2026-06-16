import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'sl-health-factor-badge',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    <span class="health-badge" [class.safe]="healthFactor >= 1.5" [class.warning]="healthFactor < 1.5 && healthFactor >= 1.1" [class.danger]="healthFactor < 1.1" [title]="tooltip">
      {{ displayValue }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthFactorBadgeComponent {
  @Input({ required: true }) healthFactor = Number.POSITIVE_INFINITY;

  get displayValue(): string {
    return Number.isFinite(this.healthFactor) ? this.healthFactor.toFixed(2) : 'Safe';
  }

  get tooltip(): string {
    if (!Number.isFinite(this.healthFactor)) {
      return 'No borrow exposure';
    }
    if (this.healthFactor >= 1.5) {
      return 'Healthy collateral buffer';
    }
    if (this.healthFactor >= 1.1) {
      return 'Monitor your position';
    }
    return 'Liquidation risk is elevated';
  }
}
