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
            <div class="pw-wrapper">
              <input [(ngModel)]="newPassword" [type]="showNew() ? 'text' : 'password'" placeholder="Min 8 chars, mixed case + number + symbol" />
              <button type="button" class="pw-eye" (click)="showNew.set(!showNew())" tabindex="-1">
                @if (showNew()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>
          <div class="field" style="margin-top:12px">
            <label>Confirm Password</label>
            <div class="pw-wrapper">
              <input [(ngModel)]="confirm" [type]="showConfirm() ? 'text' : 'password'" placeholder="Repeat new password" />
              <button type="button" class="pw-eye" (click)="showConfirm.set(!showConfirm())" tabindex="-1">
                @if (showConfirm()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                } @else {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
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
    .field input { width:100%; padding:10px 14px; background:#111; border:1px solid #333; border-radius:8px; color:#fff; font-size:14px; box-sizing:border-box; }
    .field input:focus { outline:none; border-color:#7c3aed; }
    .pw-wrapper { position:relative; }
    .pw-wrapper input { padding-right:44px; }
    .pw-eye { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:#555; cursor:pointer; padding:0; display:flex; align-items:center; }
    .pw-eye:hover { color:#aaa; }
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
  showNew = signal(false);
  showConfirm = signal(false);

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
