import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home').then(m => m.Home) },
  { path: 'services',  loadComponent: () => import('./pages/services/services').then(m => m.Services) },
  { path: 'about',     loadComponent: () => import('./pages/about/about').then(m => m.About) },
  { path: 'portfolio', loadComponent: () => import('./pages/portfolio/portfolio').then(m => m.Portfolio) },
  { path: 'contact',   loadComponent: () => import('./pages/contact/contact').then(m => m.Contact) },
  { path: 'products/eduvilaasa', loadComponent: () => import('./pages/products/eduvilaasa/eduvilaasa').then(m => m.EduVilaasaPage) },

  { path: 'admin/login', loadComponent: () => import('./pages/admin/login/admin-login').then(m => m.AdminLogin) },
  { path: 'admin/forgot-password', loadComponent: () => import('./pages/admin/login/forgot-password').then(m => m.AdminForgotPassword) },

  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/layout/admin-layout').then(m => m.AdminLayout),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/admin/dashboard/admin-dashboard').then(m => m.AdminDashboard) },
      { path: 'schools', loadComponent: () => import('./pages/admin/schools/schools-list').then(m => m.SchoolsList) },
      { path: 'schools/onboard', loadComponent: () => import('./pages/admin/schools/onboard/onboard-school').then(m => m.OnboardSchool) },
      { path: 'schools/:id', loadComponent: () => import('./pages/admin/schools/school-detail/school-detail').then(m => m.SchoolDetail) },
      { path: 'revenue', loadComponent: () => import('./pages/admin/revenue/revenue-dashboard').then(m => m.RevenueDashboard) },
      { path: 'broadcast', loadComponent: () => import('./pages/admin/broadcast/broadcast').then(m => m.BroadcastPage) },
      { path: 'content', loadComponent: () => import('./pages/admin/content/content-library').then(m => m.ContentLibrary) },
    ]
  },

  { path: '**', redirectTo: '' }
];
