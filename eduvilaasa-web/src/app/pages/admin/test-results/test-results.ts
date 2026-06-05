import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-test-results',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  templateUrl: './test-results.html',
  styleUrl: './test-results.scss',
})
export class AdminTestResultsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  tests = signal<any[]>([]);
  students = signal<any[]>([]);
  results = signal<any[]>([]);
  selectedTest = signal<any>(null);
  loading = signal(false);
  saving = signal(false);
  scores: Record<string, { score: number | null; remarks: string }> = {};

  ngOnInit() { this.loadTests(); this.loadStudents(); }

  private get iid() { return this.auth.institutionId; }

  loadTests() {
    this.http.get<any[]>(`${environment.apiUrl}/question-bank/tests?institution_id=${this.iid}`).subscribe({
      next: (tests) => this.tests.set(tests.filter((t) => t.status === 'published' || t.status === 'closed')),
      error: () => this.toast.error('Failed to load tests'),
    });
  }

  loadStudents() {
    this.http.get<any>(`${environment.apiUrl}/institutions/${this.iid}/users?role=student&limit=200`).subscribe({
      next: (res) => this.students.set(res.data ?? res),
    });
  }

  selectTest(test: any) {
    this.selectedTest.set(test);
    this.scores = {};
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/test-results/test/${test.id}`).subscribe({
      next: (res) => {
        res.results.forEach((r: any) => { this.scores[r.student_id] = { score: r.score, remarks: r.remarks ?? '' }; });
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  getScore(studentId: string): number | null { return this.scores[studentId]?.score ?? null; }
  getRemarks(studentId: string): string { return this.scores[studentId]?.remarks ?? ''; }
  setScore(studentId: string, val: string) { if (!this.scores[studentId]) this.scores[studentId] = { score: null, remarks: '' }; this.scores[studentId].score = val === '' ? null : +val; }
  setRemarks(studentId: string, val: string) { if (!this.scores[studentId]) this.scores[studentId] = { score: null, remarks: '' }; this.scores[studentId].remarks = val; }

  save() {
    const test = this.selectedTest();
    if (!test) return;
    const results = this.students()
      .filter((s) => this.scores[s.id]?.score != null)
      .map((s) => ({ student_id: s.id, score: this.scores[s.id].score!, remarks: this.scores[s.id].remarks }));
    if (!results.length) { this.toast.warning('No scores entered'); return; }
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/test-results`, { test_id: test.id, results }).subscribe({
      next: () => { this.toast.success('Results saved'); this.saving.set(false); },
      error: () => { this.toast.error('Failed to save results'); this.saving.set(false); },
    });
  }
}
