import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn 5 min before expiry

function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  showWarning = signal(false);
  secondsLeft = signal(0);

  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private logoutTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  start() {
    this.clear();
    const token = this.auth.accessToken;
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;

    const now = Date.now();
    const msUntilExpiry = expiry - now;
    if (msUntilExpiry <= 0) { this.logout(); return; }

    const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;
    if (msUntilWarning > 0) {
      this.warningTimer = setTimeout(() => this.startWarning(expiry), msUntilWarning);
    } else {
      this.startWarning(expiry);
    }
  }

  extend() {
    this.auth.refreshAccessToken().subscribe({ next: () => { this.showWarning.set(false); this.start(); } });
  }

  logout() {
    this.clear();
    this.auth.logout();
  }

  stop() { this.clear(); this.showWarning.set(false); }

  private startWarning(expiry: number) {
    this.showWarning.set(true);
    this.countdownInterval = setInterval(() => {
      const s = Math.max(0, Math.round((expiry - Date.now()) / 1000));
      this.secondsLeft.set(s);
      if (s <= 0) { this.clear(); this.logout(); }
    }, 1000);
  }

  private clear() {
    if (this.warningTimer) { clearTimeout(this.warningTimer); this.warningTimer = null; }
    if (this.logoutTimer) { clearTimeout(this.logoutTimer); this.logoutTimer = null; }
    if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
  }
}
