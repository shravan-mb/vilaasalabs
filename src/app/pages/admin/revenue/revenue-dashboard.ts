import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { AdminApiService } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-revenue-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue-dashboard.html',
  styleUrl: './revenue-dashboard.scss',
})
export class RevenueDashboard implements OnInit {
  data = signal<any>(null);
  loading = signal(true);
  constructor(private api: AdminApiService) {}
  ngOnInit() {
    this.api.getRevenue().subscribe({
      next: (res) => { this.data.set(res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  planColor(plan: string): string {
    const m: Record<string, string> = { trial: '#a78bfa', starter: '#60a5fa', growth: '#34d399', pro: '#f59e0b' };
    return m[plan] ?? '#888';
  }
}
