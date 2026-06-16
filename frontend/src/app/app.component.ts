import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@Component({
  selector: 'sl-root',
  standalone: true,
  imports: [FooterComponent, HeaderComponent, RouterOutlet, SidebarComponent],
  template: `
    <sl-header />
    <div class="app-shell">
      <sl-sidebar />
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
    <sl-footer />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
