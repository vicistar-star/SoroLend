import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { WalletConnectComponent } from '../../shared/wallet-connect/wallet-connect.component';

@Component({
  selector: 'sl-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, WalletConnectComponent],
  template: `
    <header class="topbar">
      <a class="brand" routerLink="/">SoroLend</a>
      <nav class="topnav" aria-label="Primary">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
        <a routerLink="/lend" routerLinkActive="active">Lend</a>
        <a routerLink="/borrow" routerLinkActive="active">Borrow</a>
        <a routerLink="/collateral" routerLinkActive="active">Collateral</a>
        <a routerLink="/portfolio" routerLinkActive="active">Portfolio</a>
        <a routerLink="/governance" routerLinkActive="active">Governance</a>
      </nav>
      <sl-wallet-connect />
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {}
