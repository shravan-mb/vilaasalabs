import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InstitutionSettingsService } from '../../core/services/institution-settings.service';
import { SessionTimeoutService } from '../../core/services/session-timeout.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmDialogComponent } from '../components/confirm-dialog/confirm-dialog';
import { ToastComponent } from '../components/toast/toast';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, ToastComponent, ConfirmDialogComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout implements OnInit, OnDestroy {
  auth = inject(AuthService);
  session = inject(SessionTimeoutService);
  theme = inject(ThemeService);
  settings = inject(InstitutionSettingsService);

  sidebarOpen = signal(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  user = this.auth.currentUser;
  roleLabel = computed(() => {
    const role = this.user()?.role ?? '';
    const map: Record<string, string> = { institution_admin: 'Admin', institution_staff: 'Staff', teacher: 'Teacher', student: 'Student', parent: 'Parent' };
    return map[role] ?? role;
  });

  ngOnInit() {
    this.session.start();
    if (this.auth.institutionId) { this.settings.load(); }
  }
  ngOnDestroy() { this.session.stop(); }

  toggleSidebar() { this.sidebarOpen.update((v) => !v); }
  logout() { this.auth.logout(); }
  extendSession() { this.session.extend(); }
  forceLogout() { this.session.logout(); }
}
