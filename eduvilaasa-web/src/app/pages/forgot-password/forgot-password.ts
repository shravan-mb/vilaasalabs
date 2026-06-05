import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-logo">EduVilaasa</div>
        <h2>Forgot Password</h2>
        <p class="auth-sub">Enter your email and we'll send a reset link.</p>

        @if (sent()) {
          <div class="alert alert-success" style="margin-bottom:16px">
            Reset link sent! Check your inbox (and spam folder).
          </div>
          <a routerLink="/login" class="btn btn-primary" style="width:100%;text-align:center">Back to Login</a>
        } @else {
          @if (error()) { <div class="alert alert-error" style="margin-bottom:16px">{{ error() }}</div> }
          <div class="field">
            <label>Email address</label>
            <input [(ngModel)]="email" type="email" placeholder="admin@school.com" />
          </div>
          <button class="btn btn-primary" style="width:100%;margin-top:20px" (click)="submit()" [disabled]="loading()">
            @if (loading()) { Sending... } @else { Send Reset Link }
          </button>
          <div style="text-align:center;margin-top:16px">
            <a routerLink="/login" style="color:#7c3aed;font-size:13px">Back to Login</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0a; }
    .auth-card { background:#111; border:1px solid #1f1f1f; border-radius:12px; padding:36px; width:100%; max-width:400px; }
    .auth-logo { font-size:22px; font-weight:800; color:#7c3aed; margin-bottom:24px; }
    h2 { font-size:20px; font-weight:700; color:#fff; margin-bottom:6px; }
    .auth-sub { color:#666; font-size:13px; margin-bottom:24px; }
  `],
})
export class ForgotPasswordPage {
  private http = inject(HttpClient);
  email = '';
  loading = signal(false);
  sent = signal(false);
  error = signal('');

  submit() {
    if (!this.email.trim()) { this.error.set('Email is required'); return; }
    this.loading.set(true);
    this.error.set('');
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email, app: 'eduvilaasa' })
      .subscribe({ next: () => { this.sent.set(true); this.loading.set(false); }, error: () => { this.sent.set(true); this.loading.set(false); } });
  }
}
