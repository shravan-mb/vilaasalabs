import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  navItems = [
    { label: 'Dashboard',  path: '/admin/dashboard',  icon: '📊' },
    { label: 'Schools',    path: '/admin/schools',     icon: '🏫' },
    { label: 'Revenue',    path: '/admin/revenue',     icon: '💰' },
    { label: 'Broadcast',  path: '/admin/broadcast',   icon: '📢' },
    { label: 'Onboard',    path: '/admin/schools/onboard', icon: '➕' },
  ];

  sidebarOpen = signal(typeof window !== 'undefined' ? window.innerWidth > 768 : true);

  constructor(public auth: AuthService, public theme: ThemeService) {}

  toggleSidebar() { this.sidebarOpen.update(v => !v); }
  closeSidebar()  { this.sidebarOpen.set(false); }
}
