import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-gradebook',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  template: `
    <div class="page-header">
      <div><h1>Gradebook</h1><p>View student performance across all tests</p></div>
    </div>
    <div class="card" style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:200px">
        <label>Class</label>
        <select [(ngModel)]="classId" (ngModelChange)="loadStudents($event)" style="margin-top:8px;width:100%;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff">
          <option value="">Choose class...</option>
          @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }} {{ c.section }}</option> }
        </select>
      </div>
      <div style="flex:1;min-width:200px">
        <label>Student</label>
        <select [(ngModel)]="studentId" (ngModelChange)="loadGradebook($event)" style="margin-top:8px;width:100%;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff">
          <option value="">Choose student...</option>
          @for (s of students(); track s.id) { <option [value]="s.id">{{ s.name }}</option> }
        </select>
      </div>
    </div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="5"/></div> }
    @else if (studentId && !results().length) { <div class="card"><div class="empty-state">No test results recorded yet.</div></div> }
    @else if (results().length) {
      <div class="card">
        <table class="table">
          <thead><tr><th>Test</th><th>Subject</th><th>Score</th><th>Max Marks</th><th>%</th><th>Remarks</th></tr></thead>
          <tbody>
            @for (r of results(); track r.id) {
              <tr>
                <td>{{ r.test_title }}</td>
                <td>{{ r.subject }}</td>
                <td>{{ r.score }}</td>
                <td>{{ r.test_total_marks }}</td>
                <td>
                  <span class="badge" [class.badge-success]="pct(r)>=60" [class.badge-warning]="pct(r)<60&&pct(r)>=40" [class.badge-error]="pct(r)<40">{{ pct(r) }}%</span>
                </td>
                <td style="color:#888;font-size:12px">{{ r.remarks || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class GradebookPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  classes = signal<any[]>([]);
  students = signal<any[]>([]);
  results = signal<any[]>([]);
  loading = signal(false);
  classId = '';
  studentId = '';

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/classes`).subscribe({
      next: (res) => this.classes.set((res ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))),
    });
  }

  loadStudents(classId: string) {
    this.students.set([]); this.results.set([]); this.studentId = '';
    if (!classId) return;
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/users/class/${classId}`).subscribe({ next: (res) => this.students.set(res) });
  }

  loadGradebook(studentId: string) {
    if (!studentId) return;
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/test-results/student/${studentId}`).subscribe({
      next: (res) => { this.results.set(res.results ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load grades'); this.loading.set(false); },
    });
  }

  pct(r: any): number { return r.test_total_marks ? Math.round((+r.score / +r.test_total_marks) * 100) : 0; }
}
