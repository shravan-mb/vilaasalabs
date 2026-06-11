import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-class-attendance',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  template: `
    <div class="page-header"><div><h1>Class Attendance</h1><p>Overall attendance summary for your class</p></div></div>
    <div class="card" style="margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap">
      <div style="flex:1;min-width:180px">
        <label>Class</label>
        <select [(ngModel)]="classId" (ngModelChange)="classId=$event" style="margin-top:8px;width:100%;padding:10px;background:var(--ev-input-bg);border:1px solid var(--ev-border);border-radius:8px;color:var(--ev-text)">
          <option value="">Select class...</option>
          @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }} {{ c.section }}</option> }
        </select>
      </div>
      <div style="flex:1;min-width:160px">
        <label>Subject <span style="color:#888;font-size:11px">(optional)</span></label>
        <input [(ngModel)]="subjectFilter" placeholder="Filter by subject" style="margin-top:8px;width:100%;padding:10px;background:var(--ev-input-bg);border:1px solid var(--ev-border);border-radius:8px;color:var(--ev-text);box-sizing:border-box" />
      </div>
      <div style="flex:1;min-width:140px"><label>From</label><input type="date" [(ngModel)]="dateFrom" style="margin-top:8px;width:100%;padding:10px;background:var(--ev-input-bg);border:1px solid var(--ev-border);border-radius:8px;color:var(--ev-text)" /></div>
      <div style="flex:1;min-width:140px"><label>To</label><input type="date" [(ngModel)]="dateTo" style="margin-top:8px;width:100%;padding:10px;background:var(--ev-input-bg);border:1px solid var(--ev-border);border-radius:8px;color:var(--ev-text)" /></div>
      <div style="display:flex;align-items:flex-end">
        <button class="btn btn-primary" (click)="run()">Run Report</button>
      </div>
    </div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="6"/></div> }
    @else if (data().length) {
      <div class="card">
        @if (subjectFilter) {
          <p style="font-size:12px;color:#888;margin-bottom:12px">Showing attendance for subject: <strong>{{ subjectFilter }}</strong></p>
        }
        <table class="table">
          <thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Sessions</th><th>%</th></tr></thead>
          <tbody>
            @for (s of data(); track s.student_id) {
              <tr>
                <td>{{ s.student_name }}</td>
                <td style="color:#22c55e">{{ s.present }}</td>
                <td style="color:#ef4444">{{ s.absent }}</td>
                <td style="color:#f59e0b">{{ s.late }}</td>
                <td>{{ s.total }}</td>
                <td><span class="badge" [class.badge-success]="s.percentage>=75" [class.badge-warning]="s.percentage<75&&s.percentage>=50" [class.badge-error]="s.percentage<50">{{ s.percentage }}%</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else if (ran()) {
      <div class="card"><div class="empty-state">No attendance data for the selected filters.</div></div>
    }
  `,
})
export class ClassAttendancePage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  classes = signal<any[]>([]);
  data = signal<any[]>([]);
  loading = signal(false);
  ran = signal(false);
  classId = '';
  subjectFilter = '';
  dateFrom = '';
  dateTo = '';

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/classes`).subscribe({
      next: (res) => this.classes.set((res ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))),
    });
  }

  run() {
    if (!this.classId) { this.toast.warning('Select a class'); return; }
    this.loading.set(true); this.ran.set(false);
    const p = new URLSearchParams({ class_id: this.classId });
    if (this.dateFrom) p.set('from', this.dateFrom);
    if (this.dateTo) p.set('to', this.dateTo);
    if (this.subjectFilter.trim()) p.set('subject', this.subjectFilter.trim());
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/attendance/class-report?${p}`).subscribe({
      next: (res) => { this.data.set(Array.isArray(res) ? res : []); this.loading.set(false); this.ran.set(true); },
      error: () => { this.toast.error('Failed to load data'); this.loading.set(false); },
    });
  }
}
