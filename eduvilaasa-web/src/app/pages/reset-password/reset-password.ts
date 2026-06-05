import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-logo">EduVilaasa</div>
        <h2>Reset Password</h2>

        @if (!token) {
          <div class="alert alert-error">Invalid or missing reset token. <a routerLink="/forgot-password" style="color:#fca5a5">Request a new one</a>.</div>
        } @else if (done()) {
          <div class="alert alert-success" style="margin-bottom:16px">Password reset successfully!</div>
          <a routerLink="/login" class="btn btn-primary" style="width:100%;text-align:center">Login Now</a>
        } @else {
          @if (error()) { <div class="alert alert-error" style="margin-bottom:16px">{{ error() }}</div> }
          <div class="field">
            <label>New Password</label>
            <input [(ngModel)]="newPassword" type="password" placeholder="Min 8 chars, mixed case + number + symbol" />
          </div>
          <div class="field" style="margin-top:12px">
            <label>Confirm Password</label>
            <input [(ngModel)]="confirm" type="password" placeholder="Repeat new password" />
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="submit()" [disabled]="loading()">
            @if (loading()) { Resetting... } @else { Reset Password }
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0a; }
    .auth-card { background:#111; border:1px solid #1f1f1f; border-radius:12px; padding:36px; width:100%; max-width:400px; }
    .auth-logo { font-size:22px; font-weight:800; color:#7c3aed; margin-bottom:24px; }
    h2 { font-size:20px; font-weight:700; color:#fff; margin-bottom:24px; }
  `],
})
export class ResetPasswordPage implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  confirm = '';
  loading = signal(false);
  done = signal(false);
  error = signal('');

  ngOnInit() { this.token = this.route.snapshot.queryParamMap.get('token') ?? ''; }

  submit() {
    this.error.set('');
    if (!PWD_REGEX.test(this.newPassword)) { this.error.set('Password must be 8+ chars with uppercase, lowercase, number and special character'); return; }
    if (this.newPassword !== this.confirm) { this.error.set('Passwords do not match'); return; }
    this.loading.set(true);
    this.http.post(`${environment.apiUrl}/auth/reset-password`, { token: this.token, new_password: this.newPassword })
      .subscribe({
        next: () => { this.done.set(true); this.loading.set(false); },
        error: (err) => { this.error.set(err.error?.message || 'Invalid or expired token'); this.loading.set(false); },
      });
  }
}
