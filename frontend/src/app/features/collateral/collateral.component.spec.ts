import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { CollateralComponent } from './collateral.component';

describe('CollateralComponent', () => {
  let fixture: ComponentFixture<CollateralComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollateralComponent],
      providers: [
        provideMockStore({
          initialState: {
            auth: { address: 'GABC', connected: true, jwt: 'jwt', loading: false, error: null },
            markets: { markets: [], loading: false, error: null },
            portfolio: {
              supply: [],
              borrow: [],
              collateral: { positions: [], totalValueUsd: 1000, availableBorrowUsd: 400, healthFactor: 1.6 },
              healthFactor: 1.6,
              maxBorrowUsd: 400,
              stats: null,
              loading: false,
              transactionPending: false,
              error: null
            }
          }
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CollateralComponent);
    store = TestBed.inject(MockStore);
  });

  it('computes available-to-borrow gauge percentage', () => {
    expect(fixture.componentInstance.gaugeValue(400, 1000)).toBe(40);
    expect(fixture.componentInstance.gaugeValue(400, 0)).toBe(0);
  });

  it('dispatches collateral deposit transaction from a valid form', () => {
    const dispatch = jest.spyOn(store, 'dispatch');
    fixture.componentInstance.form.setValue({ assetCode: 'XLM', amount: '25' });
    fixture.componentInstance.submit('depositCollateral');

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'depositCollateral',
        address: 'GABC',
        assetCode: 'XLM',
        amount: '25'
      })
    );
  });
});
