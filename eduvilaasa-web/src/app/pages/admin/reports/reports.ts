import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, DecimalPipe],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class ReportsPage implements OnInit {
  private api  = inject(ApiService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  classes        = signal<any[]>([]);
  attendanceData = signal<any[]>([]);
  testData       = signal<any[]>([]);
  teacherData    = signal<any[]>([]);
  loading        = signal(false);
  activeTab      = signal<'attendance' | 'tests' | 'teacher'>('attendance');

  // Plain strings — NOT signals. [(ngModel)] on a signal corrupts it.
  selectedClass = '';
  dateFrom      = '';
  dateTo        = '';
  teacherMonth  = new Date().getMonth() + 1;
  teacherYear   = new Date().getFullYear();

  ngOnInit() { this.loadClasses(); }

  loadClasses() {
    // ApiService adds the institution prefix automatically
    this.api.get<any[]>('classes').subscribe({
      next: (res) => this.classes.set(res ?? []),
      error: () => this.toast.error('Failed to load classes'),
    });
  }

  runAttendanceReport() {
    if (!this.selectedClass) { this.toast.warning('Select a class first'); return; }
    this.loading.set(true);
    this.attendanceData.set([]);
    const params: Record<string, string> = { class_id: this.selectedClass };
    if (this.dateFrom) params['from'] = this.dateFrom;
    if (this.dateTo)   params['to']   = this.dateTo;
    // attendance is institution-scoped — ApiService adds the prefix
    this.api.get<any[]>('attendance/class-report', params).subscribe({
      next: (res) => { this.attendanceData.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load attendance data'); this.loading.set(false); },
    });
  }

  runTestReport() {
    if (!this.selectedClass) { this.toast.warning('Select a class first'); return; }
    this.loading.set(true);
    this.testData.set([]);
    // test-results controller is NOT institution-scoped — use HttpClient directly
    this.http.get<any[]>(`${environment.apiUrl}/test-results/class/${this.selectedClass}`).subscribe({
      next: (res) => { this.testData.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load test data'); this.loading.set(false); },
    });
  }

  runTeacherReport() {
    this.loading.set(true);
    this.teacherData.set([]);
    this.api.get<any[]>('teacher-attendance/monthly-summary', {
      year: String(this.teacherYear),
      month: String(this.teacherMonth),
    }).subscribe({
      next: (res) => { this.teacherData.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load teacher attendance'); this.loading.set(false); },
    });
  }

  printReport() {
    const tab  = this.activeTab();
    const gen  = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const cls  = this.classes().find(c => c.id === this.selectedClass);
    const clsLabel = cls ? `${cls.name}${cls.section ? ' — ' + cls.section : ''}` : '';
    const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

    const printBase = (title: string, subtitle: string, tableHtml: string) => {
      const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>${title}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a1a; background:#fff; }
  .page { max-width:820px; margin:0 auto; padding:32px 28px; }
  .header { border-bottom:3px solid #7c3aed; padding-bottom:16px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:flex-end; }
  .report-title { font-size:22px; font-weight:700; }
  .report-sub { font-size:13px; color:#6b7280; margin-top:4px; }
  .report-meta { text-align:right; font-size:12px; color:#6b7280; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { background:#f3f4f6; padding:9px 10px; text-align:left; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#6b7280; }
  td { padding:9px 10px; border-bottom:1px solid #f3f4f6; }
  .footer { margin-top:24px; padding-top:12px; border-top:1px dashed #d1d5db; font-size:11px; color:#9ca3af; }
  .no-print { display:flex; gap:10px; justify-content:center; margin-top:24px; }
  @media print { .no-print { display:none !important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div class="page">
  <div class="header">
    <div><div class="report-title">${title}</div><div class="report-sub">${subtitle}</div></div>
    <div class="report-meta">Generated: ${gen}</div>
  </div>
  ${tableHtml}
  <div class="footer">✦ This is a computer-generated report.</div>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer">Close</button>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`;
      const w = window.open('', '_blank', 'width=880,height=900');
      if (w) { w.document.write(html); w.document.close(); }
    };

    if (tab === 'attendance') {
      const rows = this.attendanceData();
      if (!rows.length) { this.toast.warning('No data to print'); return; }
      const trs = rows.map(s => `<tr>
        <td>${s.student_name}</td>
        <td style="color:#16a34a">${s.present}</td>
        <td style="color:#dc2626">${s.absent}</td>
        <td style="color:#d97706">${s.late}</td>
        <td>${s.total}</td>
        <td><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${s.percentage>=75?'#dcfce7':s.percentage>=50?'#fef3c7':'#fee2e2'};color:${s.percentage>=75?'#16a34a':s.percentage>=50?'#d97706':'#dc2626'}">${s.percentage}%</span></td>
      </tr>`).join('');
      printBase('Student Attendance Report', `Class: <strong>${clsLabel}</strong> &nbsp;|&nbsp; ${rows.length} students`,
        `<table><thead><tr><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Total Days</th><th>Attendance %</th></tr></thead><tbody>${trs}</tbody></table>`);

    } else if (tab === 'tests') {
      const rows = this.testData();
      if (!rows.length) { this.toast.warning('No data to print'); return; }
      const trs = rows.map(t => `<tr>
        <td>${t.test_title}</td><td>${t.subject||'—'}</td><td>${t.total_marks}</td>
        <td><strong>${Number(t.avg_score).toFixed(1)}</strong></td>
        <td style="color:#16a34a">${t.highest}</td>
        <td style="color:#dc2626">${t.lowest}</td>
        <td>${t.submissions}</td>
      </tr>`).join('');
      printBase('Test Scores Report', `Class: <strong>${clsLabel}</strong> &nbsp;|&nbsp; ${rows.length} tests`,
        `<table><thead><tr><th>Test</th><th>Subject</th><th>Max Marks</th><th>Avg Score</th><th>Highest</th><th>Lowest</th><th>Submissions</th></tr></thead><tbody>${trs}</tbody></table>`);

    } else if (tab === 'teacher') {
      const rows = this.teacherData();
      if (!rows.length) { this.toast.warning('No data to print'); return; }
      const trs = rows.map((r, i) => `<tr>
        <td>${i+1}</td><td><strong>${r.teacher_name}</strong></td>
        <td style="color:#16a34a">${r.present}</td><td style="color:#dc2626">${r.absent}</td>
        <td style="color:#d97706">${r.late}</td><td style="color:#8b5cf6">${r.half_day}</td>
        <td style="color:#6b7280">${r.leave}</td><td>${r.total}</td>
        <td><span style="display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:700;background:${r.percentage>=75?'#dcfce7':r.percentage>=50?'#fef3c7':'#fee2e2'};color:${r.percentage>=75?'#16a34a':r.percentage>=50?'#d97706':'#dc2626'}">${r.percentage}%</span></td>
      </tr>`).join('');
      printBase('Teacher Attendance Report', `Month: <strong>${monthNames[this.teacherMonth]} ${this.teacherYear}</strong> &nbsp;|&nbsp; ${rows.length} teachers`,
        `<table><thead><tr><th>#</th><th>Teacher</th><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>Leave</th><th>Total</th><th>Attendance %</th></tr></thead><tbody>${trs}</tbody></table>`);
    }
  }

  exportCSV() {
    const tab = this.activeTab();
    let data: any[];
    if (tab === 'teacher') {
      data = this.teacherData();
      if (!data.length) { this.toast.warning('No data to export'); return; }
      const header = 'Teacher,Present,Absent,Late,Half Day,Leave,Total,Attendance %';
      const lines = data.map((r) =>
        [`"${r.teacher_name}"`, r.present, r.absent, r.late, r.half_day, r.leave, r.total, r.percentage].join(',')
      );
      const csv = [header, ...lines].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `teacher-attendance-${this.teacherYear}-${String(this.teacherMonth).padStart(2,'0')}.csv`;
      a.click();
      return;
    }
    data = tab === 'attendance' ? this.attendanceData() : this.testData();
    if (!data.length) { this.toast.warning('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const csv  = [keys.join(','), ...data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `report-${tab}-${Date.now()}.csv`;
    a.click();
  }
}
