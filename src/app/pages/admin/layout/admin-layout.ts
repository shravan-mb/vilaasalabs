import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

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
    { label: 'Onboard',    path: '/admin/schools/onboard', icon: '➕' },
  ];

  constructor(public auth: AuthService) {}
}
