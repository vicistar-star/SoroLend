import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'lend',
    loadComponent: () => import('./features/lending/lending.component').then((m) => m.LendingComponent)
  },
  {
    path: 'borrow',
    loadComponent: () => import('./features/borrowing/borrowing.component').then((m) => m.BorrowingComponent)
  },
  {
    path: 'collateral',
    loadComponent: () => import('./features/collateral/collateral.component').then((m) => m.CollateralComponent)
  },
  {
    path: 'portfolio',
    loadComponent: () => import('./features/portfolio/portfolio.component').then((m) => m.PortfolioComponent)
  },
  {
    path: 'governance',
    loadComponent: () => import('./features/governance/governance.component').then((m) => m.GovernanceComponent)
  },
  { path: '**', redirectTo: '' }
];
