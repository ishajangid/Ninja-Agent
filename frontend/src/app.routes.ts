import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/login.component').then(m => m.LoginComponent) },
  { path: 'interview', loadComponent: () => import('./components/interview.component').then(m => m.InterviewComponent) },
  { path: 'terms', loadComponent: () => import('./components/terms.component').then(m => m.TermsComponent) },
  { path: 'thank-you', loadComponent: () => import('./components/thank-you.component').then(m => m.ThankYouComponent) }
];
