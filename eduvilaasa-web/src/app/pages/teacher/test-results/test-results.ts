import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-teacher-test-results',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  template: `
    <div class="page-header">
      <div><h1>Enter Test Results</h1><p>Record student scores for published tests</p></div>
    </div>
    <div class="content-grid">
      <div class="card test-list">
        <div class="list-label">Select Test</div>
        @if (!tests().length) { <div class="empty-state" style="font-size:13px">No published tests.</div> }
        @for (t of tests(); track t.id) {
          <div class="test-item" [class.active]="selected()?.id===t.id" (click)="selectTest(t)">
            <div style="font-size:14px;font-weight:500;color:#fff">{{ t.title }}</div>
            <div style="font-size:12px;color:#666;margin-top:2px">{{ t.subject }} · {{ t.total_marks }} marks</div>
          </div>
        }
      </div>
      <div class="card">
        @if (!selected()) { <div class="empty-state">Select a test to enter scores</div> }
        @else if (loading()) { <app-skeleton [lines]="5"/> }
        @else {
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="font-size:16px;font-weight:600;color:#fff">{{ selected()!.title }}</h3>
            <span class="badge badge-info">Max: {{ selected()!.total_marks }}</span>
          </div>
          @if (!students().length) { <div class="empty-state">No students in this class.</div> }
          @else {
            <table class="table">
              <thead><tr><th>Student</th><th>Score</th><th>Remarks</th></tr></thead>
              <tbody>
                @for (s of students(); track s.id) {
                  <tr>
                    <td>{{ s.name }}</td>
                    <td><input type="number" class="score-inp" min="0" [max]="selected()!.total_marks" [value]="scores[s.id]?.score ?? ''" (input)="setScore(s.id, $any($event.target).value)" placeholder="—" /></td>
                    <td><input class="remark-inp" [value]="scores[s.id]?.remarks ?? ''" (input)="setRemarks(s.id, $any($event.target).value)" placeholder="Optional" /></td>
                  </tr>
                }
              </tbody>
            </table>
            <div style="text-align:right;margin-top:16px">
              <button class="btn btn-primary" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save Results' }}</button>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .content-grid{display:grid;grid-template-columns:260px 1fr;gap:16px;}
    .list-label{font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
    .test-item{padding:10px;border-radius:8px;cursor:pointer;border:1px solid transparent;margin-bottom:6px;}
    .test-item:hover{background:#1a1a1a;}
    .test-item.active{background:#1a0a2e;border-color:#7c3aed;}
    .score-inp{width:80px;padding:6px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px;color:#fff;text-align:center;}
    .remark-inp{width:100%;padding:6px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:6px;color:#fff;font-size:13px;}
    @media(max-width:768px){.content-grid{grid-template-columns:1fr;}}
  `],
})
export class TeacherTestResultsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  tests = signal<any[]>([]);
  students = signal<any[]>([]);
  selected = signal<any>(null);
  loading = signal(false);
  saving = signal(false);
  scores: Record<string, { score: number | null; remarks: string }> = {};

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/question-bank/tests`).subscribe({
      next: (res) => this.tests.set(res.filter((t: any) => t.status === 'published' || t.status === 'closed')),
    });
  }

  selectTest(test: any) {
    this.selected.set(test); this.scores = {}; this.loading.set(true);
    // Load students for this test's class
    const classId = test.class_id;
    const loadStudents = classId
      ? this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/users/class/${classId}`)
      : this.http.get<any>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/users?role=student&limit=200`);

    loadStudents.subscribe({
      next: (res: any) => {
        this.students.set(Array.isArray(res) ? res : (res.data ?? []));
        // Load existing scores
        this.http.get<any>(`${environment.apiUrl}/test-results/test/${test.id}`).subscribe({
          next: (r) => { r.results?.forEach((entry: any) => { this.scores[entry.student_id] = { score: entry.score, remarks: entry.remarks ?? '' }; }); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  setScore(id: string, v: string) { if (!this.scores[id]) this.scores[id] = { score: null, remarks: '' }; this.scores[id].score = v === '' ? null : +v; }
  setRemarks(id: string, v: string) { if (!this.scores[id]) this.scores[id] = { score: null, remarks: '' }; this.scores[id].remarks = v; }

  save() {
    const results = this.students().filter((s) => this.scores[s.id]?.score != null)
      .map((s) => ({ student_id: s.id, score: this.scores[s.id].score!, remarks: this.scores[s.id].remarks }));
    if (!results.length) { this.toast.warning('Enter at least one score'); return; }
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/test-results`, { test_id: this.selected()!.id, results }).subscribe({
      next: () => { this.toast.success('Results saved'); this.saving.set(false); },
      error: () => { this.toast.error('Failed to save'); this.saving.set(false); },
    });
  }
}
