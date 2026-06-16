import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthEffects } from './app/store/auth/auth.effects';
import { authReducer } from './app/store/auth/auth.reducer';
import { GovernanceEffects } from './app/store/governance/governance.effects';
import { governanceReducer } from './app/store/governance/governance.reducer';
import { MarketsEffects } from './app/store/markets/markets.effects';
import { marketsReducer } from './app/store/markets/markets.reducer';
import { PortfolioEffects } from './app/store/portfolio/portfolio.effects';
import { portfolioReducer } from './app/store/portfolio/portfolio.reducer';
import { PricesEffects } from './app/store/prices/prices.effects';
import { pricesReducer } from './app/store/prices/prices.reducer';
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations(),
    provideRouter(routes),
    provideStore({
      auth: authReducer,
      markets: marketsReducer,
      portfolio: portfolioReducer,
      prices: pricesReducer,
      governance: governanceReducer
    }),
    provideEffects([AuthEffects, MarketsEffects, PortfolioEffects, PricesEffects, GovernanceEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production })
  ]
}).catch((error) => console.error(error));
