import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthFactorBadgeComponent } from './health-factor-badge.component';

describe('HealthFactorBadgeComponent', () => {
  let fixture: ComponentFixture<HealthFactorBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthFactorBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HealthFactorBadgeComponent);
  });

  it('renders safe state for high health factor', () => {
    fixture.componentRef.setInput('healthFactor', 1.8);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.health-badge') as HTMLElement;
    expect(badge.textContent?.trim()).toBe('1.80');
    expect(badge.classList).toContain('safe');
  });

  it('renders danger state below liquidation buffer', () => {
    fixture.componentRef.setInput('healthFactor', 1.04);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.health-badge') as HTMLElement;
    expect(badge.classList).toContain('danger');
  });
});
