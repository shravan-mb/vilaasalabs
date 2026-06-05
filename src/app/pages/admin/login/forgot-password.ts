import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card">
        <div class="brand">Vilaasalabs Admin</div>
        <h2>Forgot Password</h2>
        <p class="sub">Enter your admin email to receive a reset link.</p>

        @if (sent()) {
          <div class="alert-success">Reset link sent! Check your inbox.</div>
          <a routerLink="/admin/login" class="btn-link">Back to Login</a>
        } @else {
          @if (err()) { <div class="alert-error">{{ err() }}</div> }
          <div class="field"><label>Email Address</label>
            <input [(ngModel)]="email" type="email" placeholder="admin@vilaasalabs.com" />
          </div>
          <button class="btn-primary" (click)="submit()" [disabled]="loading()">
            {{ loading() ? 'Sending...' : 'Send Reset Link' }}
          </button>
          <div style="margin-top:14px;text-align:center">
            <a routerLink="/admin/login" class="back-link">← Back to Login</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0a; }
    .auth-card { background:#111; border:1px solid #1f1f1f; border-radius:12px; padding:36px; width:100%; max-width:400px; }
    .brand { font-size:20px; font-weight:800; color:#7c3aed; margin-bottom:24px; }
    h2 { font-size:20px; font-weight:700; color:#fff; margin-bottom:6px; }
    .sub { color:#666; font-size:13px; margin-bottom:24px; }
    .field { margin-bottom:16px; display:flex; flex-direction:column; gap:6px; }
    .field label { font-size:12px; color:#888; }
    .field input { padding:10px; background:#0d0d0d; border:1px solid #2a2a2a; border-radius:8px; color:#fff; font-size:14px; }
    .btn-primary { width:100%; padding:12px; background:#7c3aed; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:14px; &:disabled{opacity:.6;} }
    .btn-link { display:block; text-align:center; margin-top:16px; padding:12px; background:#7c3aed; color:#fff; border-radius:8px; text-decoration:none; font-weight:600; }
    .back-link { color:#7c3aed; font-size:13px; text-decoration:none; }
    .alert-success { background:#14532d; color:#86efac; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; }
    .alert-error { background:#450a0a; color:#fca5a5; padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; }
  `],
})
export class AdminForgotPassword {
  private http = inject(HttpClient);
  email = '';
  loading = signal(false);
  sent = signal(false);
  err = signal('');

  submit() {
    if (!this.email.trim()) { this.err.set('Email is required'); return; }
    this.loading.set(true); this.err.set('');
    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email, app: 'vilaasalabs' })
      .subscribe({ next: () => { this.sent.set(true); this.loading.set(false); }, error: () => { this.sent.set(true); this.loading.set(false); } });
  }
}
