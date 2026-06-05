import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;flex-direction:column;gap:20px;text-align:center;padding:24px">
      <div style="font-size:72px;font-weight:900;color:#7c3aed;line-height:1">404</div>
      <div style="font-size:20px;font-weight:600;color:#fff">Page not found</div>
      <div style="color:#666;font-size:14px">The page you're looking for doesn't exist or was moved.</div>
      <button class="btn btn-primary" style="margin-top:8px" (click)="goHome()">Go to Dashboard</button>
    </div>
  `,
})
export class NotFoundPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  goHome() {
    if (this.auth.isLoggedIn) this.auth.redirectByRole();
    else this.router.navigate(['/login']);
  }
}
