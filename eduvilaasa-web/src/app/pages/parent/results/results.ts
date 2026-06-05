import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    @if (children().length > 1) {
      <div class="card" style="margin-bottom:16px">
        <label>View results for:</label>
        <select [(ngModel)]="selectedChildId" (ngModelChange)="loadResults($event)" style="margin-top:8px;width:100%;max-width:320px;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff">
          @for (c of children(); track c.student_id) { <option [value]="c.student_id">{{ c.student_name }}</option> }
        </select>
      </div>
    }
    @if (loading()) { <div class="card"><app-skeleton [lines]="5"/></div> }
    @else if (!results().length) { <div class="card"><div class="empty-state">No results yet.</div></div> }
    @else {
      <div class="card">
        <table class="table">
          <thead><tr><th>Test</th><th>Subject</th><th>Score</th><th>Max</th><th>%</th><th>Remarks</th></tr></thead>
          <tbody>
            @for (r of results(); track r.id) {
              <tr>
                <td>{{ r.test_title }}</td><td>{{ r.subject }}</td>
                <td style="font-weight:600;color:#fff">{{ r.score }}</td>
                <td>{{ r.test_total_marks }}</td>
                <td><span class="badge" [class.badge-success]="pct(r)>=60" [class.badge-warning]="pct(r)<60&&pct(r)>=40" [class.badge-error]="pct(r)<40">{{ pct(r) }}%</span></td>
                <td style="color:#888;font-size:12px">{{ r.remarks || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <div style="margin-top:16px;text-align:right"><button class="btn btn-secondary" (click)="print()">Print Report Card</button></div>
      </div>
    }
  `,
})
export class ParentResultsPage implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  children = signal<any[]>([]);
  results = signal<any[]>([]);
  loading = signal(false);
  selectedChildId = '';

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/student-parent/my-children`).subscribe({
      next: (res) => {
        this.children.set(res);
        if (res.length) { this.selectedChildId = res[0].student_id; this.loadResults(res[0].student_id); }
      },
      error: () => this.loadFromProfile(),
    });
  }

  loadFromProfile() {
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: () => this.loading.set(false),
    });
  }

  loadResults(studentId: string) {
    if (!studentId) return;
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/test-results/student/${studentId}`).subscribe({
      next: (res) => { this.results.set(res.results ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load results'); this.loading.set(false); },
    });
  }

  pct(r: any): number { return r.test_total_marks ? Math.round((+r.score / +r.test_total_marks) * 100) : 0; }
  print() { window.print(); }
}
