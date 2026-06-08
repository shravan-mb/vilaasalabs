import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService, BusinessOverview } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  overview = signal<BusinessOverview | null>(null);
  loading = signal(true);
  error = signal('');

  constructor(private api: AdminApiService, private router: Router) {}

  ngOnInit() {
    this.api.getOverview().subscribe({
      next: (data) => { this.overview.set(data); this.loading.set(false); },
      error: () => { this.error.set('Failed to load dashboard'); this.loading.set(false); }
    });
  }

  getPlanCount(plan: string): number {
    const found = this.overview()?.subscription_breakdown.find(b => b.plan === plan);
    return found ? +found.count : 0;
  }

  goToSchool(id: string) {
    this.router.navigate(['/admin/schools', id]);
  }
}
