import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { catchError, filter, forkJoin, of, Subscription } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [UpperCasePipe, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class AdminDashboard implements OnInit, OnDestroy {
  private api    = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }
  get isStaff()  { return this.auth.hasRole('institution_staff'); }

  loading = signal(true);

  // Admin-only
  counts       = signal<Record<string, number>>({});
  subscription = signal<any>(null);

  // Staff-focused
  todaySummary = signal<{ total_collected: number; transaction_count: number; recent_payments: any[] } | null>(null);

  private routerSub?: Subscription;

  ngOnInit() {
    this.loadData();

    // Reload whenever user navigates back to this dashboard
    this.routerSub = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      filter((e) => e.urlAfterRedirects.includes('/dashboard')),
    ).subscribe(() => this.loadData());
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  loadData() {
    this.loading.set(true);
    if (this.isAdmin) {
      forkJoin({
        counts:       this.api.get<Record<string, number>>('users/counts').pipe(catchError(() => of({}))),
        subscription: this.api.get<any>('subscriptions/current').pipe(catchError(() => of(null))),
      }).subscribe(({ counts, subscription }) => {
        this.counts.set(counts);
        this.subscription.set(subscription);
        this.loading.set(false);
      });
    } else {
      const empty = { total_collected: 0, transaction_count: 0, recent_payments: [] };
      this.api.get<any>('fees/today-summary').pipe(catchError(() => of(empty))).subscribe((s) => {
        this.todaySummary.set(s ?? empty);
        this.loading.set(false);
      });
    }
  }

  get students()   { return this.counts()['student'] ?? 0; }
  get teachers()   { return this.counts()['teacher'] ?? 0; }
  get staff()      { return this.counts()['institution_staff'] ?? 0; }
  get parents()    { return this.counts()['parent'] ?? 0; }
  get planName()   { return this.subscription()?.plan ?? '—'; }
  get planStatus() { return this.subscription()?.status ?? '—'; }
  get planExpiry() {
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
