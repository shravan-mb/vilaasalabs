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
    this.api.get<any[]>(`institutions/${this.institutionId}/teacher-attendance/date/${this.selectedDate}`).subscribe({
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
    this.api.post(`institutions/${this.institutionId}/teacher-attendance/mark`, {
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
      `institutions/${this.institutionId}/teacher-attendance/monthly-summary?year=${this.selectedYear}&month=${this.selectedMonth}`
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

  downloadTemplate() {
    const csv = 'Phone,Date,CheckIn,CheckOut\n9911000000,2025-06-09,09:00,17:00\n9911000001,2025-06-09,09:20,17:00';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'biometric_template.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
