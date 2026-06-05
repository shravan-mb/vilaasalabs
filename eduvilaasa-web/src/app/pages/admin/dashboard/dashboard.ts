import { UpperCasePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [UpperCasePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  loading = signal(true);
  counts = signal<Record<string, number>>({});
  subscription = signal<any>(null);

  ngOnInit() {
    forkJoin({
      counts: this.api.get<Record<string, number>>('users/counts'),
      subscription: this.api.get<any>('subscriptions/current'),
    }).subscribe({
      next: ({ counts, subscription }) => {
        this.counts.set(counts);
        this.subscription.set(subscription);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  get students()     { return this.counts()['student'] ?? 0; }
  get teachers()     { return this.counts()['teacher'] ?? 0; }
  get staff()        { return this.counts()['institution_staff'] ?? 0; }
  get parents()      { return this.counts()['parent'] ?? 0; }
  get planName()     { return this.subscription()?.plan ?? '—'; }
  get planStatus()   { return this.subscription()?.status ?? '—'; }
  get planExpiry()   {
    const d = this.subscription()?.expires_at;
    return d ? new Date(d).toLocaleDateString('en-IN') : '—';
  }
  get daysLeft() {
    const exp = this.subscription()?.expires_at;
    if (!exp) return null;
    const diff = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  }
}
