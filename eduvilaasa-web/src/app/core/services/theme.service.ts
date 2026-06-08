import { Injectable, signal } from '@angular/core';

const KEY = 'ev_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(true);

  constructor() {
    const saved = localStorage.getItem(KEY);
    const dark = saved !== 'light';
    this.isDark.set(dark);
    this._apply(dark);
  }

  toggle() {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(KEY, next ? 'dark' : 'light');
    this._apply(next);
  }

  private _apply(dark: boolean) {
    if (dark) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }
}
