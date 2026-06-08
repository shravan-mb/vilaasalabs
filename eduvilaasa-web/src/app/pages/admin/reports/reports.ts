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
  loading        = signal(false);
  activeTab      = signal<'attendance' | 'tests'>('attendance');

  // Plain strings — NOT signals. [(ngModel)] on a signal corrupts it.
  selectedClass = '';
  dateFrom      = '';
  dateTo        = '';

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

  printReport() { window.print(); }

  exportCSV() {
    const data = this.activeTab() === 'attendance' ? this.attendanceData() : this.testData();
    if (!data.length) { this.toast.warning('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const csv  = [keys.join(','), ...data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `report-${this.activeTab()}-${Date.now()}.csv`;
    a.click();
  }
}
