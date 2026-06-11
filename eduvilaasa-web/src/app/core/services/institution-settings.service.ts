import { inject, Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';

const DEFAULTS: Record<string, boolean> = {
  show_subscription_tab: true,
};

@Injectable({ providedIn: 'root' })
export class InstitutionSettingsService {
  private api = inject(ApiService);

  flags           = signal<Record<string, boolean>>({ ...DEFAULTS });
  institutionName = signal<string>('');
  loaded          = signal(false);
  private loading = false;

  get showSubscriptionTab(): boolean {
    return this.flags()['show_subscription_tab'] ?? true;
  }

  isEnabled(key: string): boolean {
    return this.flags()[key] ?? (DEFAULTS[key] ?? true);
  }

  load() {
    if (this.loading || this.loaded()) return;
    this.loading = true;

    // Load feature flags
    this.api.get<{ feature_flags: Record<string, boolean> }>('settings').subscribe({
      next: (res) => {
        this.flags.set({ ...DEFAULTS, ...(res.feature_flags ?? {}) });
        this.loaded.set(true);
        this.loading = false;
      },
      error: () => {
        this.flags.set({ ...DEFAULTS });
        this.loaded.set(true);
        this.loading = false;
      },
    });

    // Load institution name for sidebar branding
    this.api.get<{ name: string }>('profile').subscribe({
      next: (res) => { if (res?.name) this.institutionName.set(res.name); },
      error: () => {},
    });
  }
}
