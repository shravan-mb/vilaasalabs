import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-student-results',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="page-header"><div><h1>My Results</h1><p>Your test scores and performance</p></div></div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="5"/></div> }
    @else if (!results().length) { <div class="card"><div class="empty-state">No results published yet.</div></div> }
    @else {
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{{ results().length }}</div><div class="stat-label">Tests Taken</div></div>
        <div class="stat-card"><div class="stat-value">{{ avgPct() }}%</div><div class="stat-label">Average Score</div></div>
        <div class="stat-card"><div class="stat-value">{{ bestPct() }}%</div><div class="stat-label">Best Score</div></div>
      </div>
      <div class="card">
        <table class="table">
          <thead><tr><th>Test</th><th>Subject</th><th>Score</th><th>Max</th><th>Percentage</th><th>Remarks</th></tr></thead>
          <tbody>
            @for (r of results(); track r.id) {
              <tr>
                <td>{{ r.test_title }}</td>
                <td>{{ r.subject }}</td>
                <td style="font-weight:600;color:#fff">{{ r.score }}</td>
                <td>{{ r.test_total_marks }}</td>
                <td><span class="badge" [class.badge-success]="pct(r)>=60" [class.badge-warning]="pct(r)<60&&pct(r)>=40" [class.badge-error]="pct(r)<40">{{ pct(r) }}%</span></td>
                <td style="color:#888;font-size:12px">{{ r.remarks || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`.stats-row{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;} .stats-row .stat-card{flex:1;min-width:140px;}`],
})
export class StudentResultsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  results = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/test-results/my`).subscribe({
      next: (res) => { this.results.set(res.results ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load results'); this.loading.set(false); },
    });
  }

  pct(r: any): number { return r.test_total_marks ? Math.round((+r.score / +r.test_total_marks) * 100) : 0; }
  avgPct(): number {
    if (!this.results().length) return 0;
    return Math.round(this.results().reduce((s, r) => s + this.pct(r), 0) / this.results().length);
  }
  bestPct(): number { return this.results().length ? Math.max(...this.results().map((r) => this.pct(r))) : 0; }
}
