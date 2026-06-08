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
        <select [(ngModel)]="classId" (ngModelChange)="classId=$event" style="margin-top:8px;width:100%;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff">
          <option value="">Select class...</option>
          @for (c of classes(); track c.id) { <option [value]="c.id">{{ c.name }} {{ c.section }}</option> }
        </select>
      </div>
      <div style="flex:1;min-width:140px"><label>From</label><input type="date" [(ngModel)]="dateFrom" style="margin-top:8px;width:100%;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff" /></div>
      <div style="flex:1;min-width:140px"><label>To</label><input type="date" [(ngModel)]="dateTo" style="margin-top:8px;width:100%;padding:10px;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:8px;color:#fff" /></div>
      <div style="display:flex;align-items:flex-end">
        <button class="btn btn-primary" (click)="run()">Run Report</button>
      </div>
    </div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="6"/></div> }
    @else if (data().length) {
      <div class="card">
        <table class="table">
          <thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th>%</th></tr></thead>
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
      <div class="card"><div class="empty-state">No attendance data for the selected period.</div></div>
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
  dateFrom = '';
  dateTo = '';

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/classes`).subscribe({ next: (res) => this.classes.set(res) });
  }

  run() {
    if (!this.classId) { this.toast.warning('Select a class'); return; }
    this.loading.set(true); this.ran.set(false);
    const p = new URLSearchParams({ class_id: this.classId });
    if (this.dateFrom) p.set('from', this.dateFrom);
    if (this.dateTo) p.set('to', this.dateTo);
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/attendance/class-report?${p}`).subscribe({
      next: (res) => { this.data.set(Array.isArray(res) ? res : []); this.loading.set(false); this.ran.set(true); },
      error: () => { this.toast.error('Failed to load data'); this.loading.set(false); },
    });
  }
}
