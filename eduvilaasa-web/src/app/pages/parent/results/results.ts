import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-parent-results',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  template: `
    <div class="page-header">
      <div><h1>Child Results</h1><p>Test scores for your children</p></div>
    </div>

    @if (loadingChildren()) {
      <div class="card"><app-skeleton [lines]="3"/></div>
    } @else if (children().length === 0) {
      <div class="card"><div class="empty-state">No children linked to your account yet.</div></div>
    } @else {
      @if (children().length > 1) {
        <div class="card" style="margin-bottom:16px">
          <div class="field">
            <label>View results for</label>
            <select [(ngModel)]="selectedChildId" (ngModelChange)="loadResults($event)">
              @for (c of children(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="card"><app-skeleton [lines]="5"/></div>
      } @else if (!results().length) {
        <div class="card"><div class="empty-state">No results yet for {{ selectedChildName() }}.</div></div>
      } @else {
        <div class="stats-row">
          <div class="stat-card"><div class="label">Tests Taken</div><div class="value">{{ results().length }}</div></div>
          <div class="stat-card"><div class="label">Average Score</div><div class="value">{{ avgPct() }}%</div></div>
          <div class="stat-card"><div class="label">Best Score</div><div class="value">{{ bestPct() }}%</div></div>
        </div>
        <div class="card">
          <table class="table">
            <thead>
              <tr><th>Test</th><th>Subject</th><th>Score</th><th>Max Marks</th><th>Percentage</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              @for (r of results(); track r.id) {
                <tr>
                  <td>{{ r.test_title }}</td>
                  <td>{{ r.subject || '—' }}</td>
                  <td style="font-weight:600;color:var(--ev-white)">{{ r.score }}</td>
                  <td>{{ r.test_total_marks }}</td>
                  <td>
                    <span class="badge"
                      [class.badge-success]="pct(r) >= 60"
                      [class.badge-yellow]="pct(r) < 60 && pct(r) >= 40"
                      [class.badge-error]="pct(r) < 40">
                      {{ pct(r) }}%
                    </span>
                  </td>
                  <td style="color:var(--ev-muted);font-size:12px">{{ r.remarks || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div style="margin-top:16px;text-align:right">
            <button class="btn btn-secondary" (click)="print()">🖨 Print Report Card</button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .stats-row { display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap; }
    .stats-row .stat-card { flex:1; min-width:140px; }
  `],
})
export class ParentResultsPage implements OnInit {
  private http  = inject(HttpClient);
  private api   = inject(ApiService);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  children       = signal<any[]>([]);
  results        = signal<any[]>([]);
  loadingChildren = signal(true);
  loading        = signal(false);
  selectedChildId = '';

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.api.get<any[]>(`users/${userId}/children`).subscribe({
      next: (res) => {
        this.children.set(res ?? []);
        this.loadingChildren.set(false);
        if (res?.length) {
          this.selectedChildId = res[0].id;
          this.loadResults(res[0].id);
        }
      },
      error: () => {
        this.toast.error('Failed to load children');
        this.loadingChildren.set(false);
      },
    });
  }

  loadResults(studentId: string) {
    if (!studentId) return;
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/test-results/student/${studentId}`).subscribe({
      next: (res) => { this.results.set(res?.results ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load results'); this.loading.set(false); },
    });
  }

  selectedChildName(): string {
    return this.children().find(c => c.id === this.selectedChildId)?.name ?? '';
  }

  pct(r: any): number { return r.test_total_marks ? Math.round((+r.score / +r.test_total_marks) * 100) : 0; }
  avgPct(): number {
    if (!this.results().length) return 0;
    return Math.round(this.results().reduce((s, r) => s + this.pct(r), 0) / this.results().length);
  }
  bestPct(): number { return this.results().length ? Math.max(...this.results().map(r => this.pct(r))) : 0; }
  print() { window.print(); }
}
