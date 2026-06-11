import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave';

interface TeacherRow {
  teacher: { id: string; name: string; phone: string };
  record: { id: string; status: AttendanceStatus; check_in_time: string | null; check_out_time: string | null; remarks: string | null } | null;
  selected: AttendanceStatus;
}

interface MonthlySummaryRow {
  teacher_id: string;
  teacher_name: string;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  leave: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './teacher-attendance.html',
  styleUrl: './teacher-attendance.scss',
})
export class TeacherAttendancePage implements OnInit {
  private api  = inject(ApiService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  activeTab = signal<'daily' | 'monthly' | 'import'>('daily');

  // Daily tab
  selectedDate = new Date().toISOString().split('T')[0];
  rows         = signal<TeacherRow[]>([]);
  loadingDaily = signal(false);
  savingDaily  = signal(false);
  dailyMsg     = signal('');
  dailyErr     = signal('');
  isMarked     = signal(false);

  // Monthly tab
  today        = new Date();
  selectedYear  = this.today.getFullYear();
  selectedMonth = this.today.getMonth() + 1;
  summary      = signal<MonthlySummaryRow[]>([]);
  loadingMonthly = signal(false);

  // CSV import tab
  csvFile      = signal<File | null>(null);
  importing    = signal(false);
  importResult = signal<{ imported: number; skipped: number; errors: string[] } | null>(null);
  importErr    = signal('');

  readonly statuses: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day', 'leave'];
  readonly statusLabels: Record<AttendanceStatus, string> = {
    present:  'Present',
    absent:   'Absent',
    late:     'Late',
    half_day: 'Half Day',
    leave:    'Leave',
  };
  readonly statusColors: Record<AttendanceStatus, string> = {
    present:  '#22c55e',
    absent:   '#ef4444',
    late:     '#f59e0b',
    half_day: '#8b5cf6',
    leave:    '#64748b',
  };

  get institutionId() { return this.auth.institutionId!; }

  switchTab(tab: 'daily' | 'monthly' | 'import') {
    this.activeTab.set(tab);
    if (tab === 'daily') this.loadDaily();
    else if (tab === 'monthly') this.loadMonthly();
  }

  countPresent()  { return this.rows().filter(r => r.selected === 'present').length; }
  countAbsent()   { return this.rows().filter(r => r.selected === 'absent').length; }
  countLate()     { return this.rows().filter(r => r.selected === 'late').length; }
  countLeave()    { return this.rows().filter(r => r.selected === 'leave').length; }

  ngOnInit() {
    this.loadDaily();
    this.loadMonthly();
  }

  loadDaily() {
    this.loadingDaily.set(true);
    this.dailyMsg.set('');
    this.dailyErr.set('');
    this.api.get<any[]>(`teacher-attendance/date/${this.selectedDate}`).subscribe({
      next: (data) => {
        this.rows.set(data.map((d) => ({
          teacher:  d.teacher,
          record:   d.record,
          selected: d.record?.status ?? 'present',
        })));
        this.isMarked.set(data.some((d) => d.record !== null));
        this.loadingDaily.set(false);
      },
      error: () => this.loadingDaily.set(false),
    });
  }

  markAll(status: AttendanceStatus) {
    this.rows.update((rows) => rows.map((r) => ({ ...r, selected: status })));
  }

  saveAttendance() {
    this.savingDaily.set(true);
    this.dailyErr.set('');
    const entries = this.rows().map((r) => ({ teacher_id: r.teacher.id, status: r.selected }));
    this.api.post(`teacher-attendance/mark`, {
      date: this.selectedDate,
      entries,
    }).subscribe({
      next: () => {
        this.dailyMsg.set('Attendance saved successfully.');
        this.savingDaily.set(false);
        this.isMarked.set(true);
        setTimeout(() => this.dailyMsg.set(''), 3000);
        this.loadDaily();
      },
      error: (e) => {
        this.dailyErr.set(e.error?.message || 'Failed to save attendance.');
        this.savingDaily.set(false);
      },
    });
  }

  loadMonthly() {
    this.loadingMonthly.set(true);
    this.api.get<MonthlySummaryRow[]>(
      `teacher-attendance/monthly-summary`,
      { year: String(this.selectedYear), month: String(this.selectedMonth) }
    ).subscribe({
      next: (data) => { this.summary.set(data); this.loadingMonthly.set(false); },
      error: () => this.loadingMonthly.set(false),
    });
  }

  get months() {
    return [
      { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
      { value: 4, label: 'April' },   { value: 5, label: 'May' },      { value: 6, label: 'June' },
      { value: 7, label: 'July' },    { value: 8, label: 'August' },   { value: 9, label: 'September' },
      { value: 10, label: 'October' },{ value: 11, label: 'November' },{ value: 12, label: 'December' },
    ];
  }

  get years() {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    this.csvFile.set(input.files?.[0] ?? null);
    this.importResult.set(null);
    this.importErr.set('');
  }

  importCsv() {
    const file = this.csvFile();
    if (!file) return;
    this.importing.set(true);
    this.importErr.set('');
    this.importResult.set(null);

    const form = new FormData();
    form.append('file', file);

    this.http.post<any>(
      `${environment.apiUrl}/institutions/${this.institutionId}/teacher-attendance/csv-import`,
      form,
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: (res) => { this.importResult.set(res); this.importing.set(false); this.loadDaily(); this.loadMonthly(); },
      error: (e)  => { this.importErr.set(e.error?.message || 'Import failed.'); this.importing.set(false); },
    });
  }

  exportMonthlyCsv() {
    const rows = this.summary();
    if (!rows.length) return;
    const monthLabel = this.months.find(m => m.value === this.selectedMonth)?.label ?? this.selectedMonth;
    const header = 'Teacher,Present,Absent,Late,Half Day,Leave,Total Days,Attendance %';
    const lines = rows.map(r =>
      [`"${r.teacher_name}"`, r.present, r.absent, r.late, r.half_day, r.leave, r.total, `${r.percentage}%`].join(',')
    );
    const csv = [header, ...lines].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `teacher-attendance-${monthLabel}-${this.selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  printMonthlyReport() {
    const rows = this.summary();
    if (!rows.length) return;
    const monthLabel = this.months.find(m => m.value === this.selectedMonth)?.label ?? this.selectedMonth;
    const genDate = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const tableRows = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${r.teacher_name}</strong></td>
        <td style="color:#16a34a">${r.present}</td>
        <td style="color:#dc2626">${r.absent}</td>
        <td style="color:#d97706">${r.late}</td>
        <td style="color:#8b5cf6">${r.half_day}</td>
        <td style="color:#6b7280">${r.leave}</td>
        <td>${r.total}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:8px;background:#f3f4f6;border-radius:4px;overflow:hidden">
              <div style="height:100%;width:${r.percentage}%;background:${r.percentage >= 75 ? '#22c55e' : '#ef4444'};border-radius:4px"></div>
            </div>
            <span style="font-size:12px;font-weight:600;color:${r.percentage >= 75 ? '#16a34a' : '#dc2626'}">${r.percentage}%</span>
          </div>
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Teacher Attendance — ${monthLabel} ${this.selectedYear}</title>
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
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="report-title">Teacher Attendance Report</div>
      <div class="report-sub">Month: <strong>${monthLabel} ${this.selectedYear}</strong> &nbsp;|&nbsp; Total Teachers: <strong>${rows.length}</strong></div>
    </div>
    <div class="report-meta">Generated: ${genDate}</div>
  </div>
  <table>
    <thead>
      <tr><th>#</th><th>Teacher</th><th>Present</th><th>Absent</th><th>Late</th><th>Half Day</th><th>Leave</th><th>Total Days</th><th>Attendance %</th></tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">✦ This is a computer-generated attendance report.</div>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer">Close</button>
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=880,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }

  downloadTemplate() {
    const csv = 'Phone,Date,CheckIn,CheckOut\n9911000000,2025-06-09,09:00,17:00\n9911000001,2025-06-09,09:20,17:00';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'biometric_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
