import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
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
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  classes = signal<any[]>([]);
  attendanceData = signal<any[]>([]);
  testData = signal<any[]>([]);
  loading = signal(false);
  activeTab = signal<'attendance' | 'tests'>('attendance');
  selectedClass = signal('');
  dateFrom = signal('');
  dateTo = signal('');

  ngOnInit() { this.loadClasses(); }

  loadClasses() {
    this.http.get<any[]>(`${environment.apiUrl}/classes`).subscribe({
      next: (res) => this.classes.set(res),
    });
  }

  runAttendanceReport() {
    if (!this.selectedClass()) { this.toast.warning('Select a class'); return; }
    this.loading.set(true);
    const params = new URLSearchParams({ class_id: this.selectedClass() });
    if (this.dateFrom()) params.set('from', this.dateFrom());
    if (this.dateTo()) params.set('to', this.dateTo());
    this.http.get<any>(`${environment.apiUrl}/attendance/summary?${params}`).subscribe({
      next: (res) => { this.attendanceData.set(Array.isArray(res) ? res : res.students ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load attendance data'); this.loading.set(false); },
    });
  }

  runTestReport() {
    if (!this.selectedClass()) { this.toast.warning('Select a class'); return; }
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/test-results/class/${this.selectedClass()}`).subscribe({
      next: (res) => { this.testData.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load test data'); this.loading.set(false); },
    });
  }

  printReport() { window.print(); }

  exportCSV() {
    const data = this.activeTab() === 'attendance' ? this.attendanceData() : this.testData();
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(','), ...data.map((r) => keys.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `report-${this.activeTab()}-${Date.now()}.csv`;
    a.click();
  }
}
