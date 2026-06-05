import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mark-attendance.html',
  styleUrl: './mark-attendance.scss',
})
export class MarkAttendance implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  classes = signal<any[]>([]);
  entries = signal<Array<{ student_id: string; name: string; status: string; remarks: string }>>([]);
  loadingStudents = signal(false);
  saving = signal(false);
  submitted = signal(false);

  selectedClass = '';
  date = this.today();

  ngOnInit() {
    this.api.get<any[]>('classes').subscribe((data) => this.classes.set(data));
  }

  onClassChange() {
    if (!this.selectedClass) return;
    this.loadingStudents.set(true);
    this.api.get<any[]>(`users/class/${this.selectedClass}`).subscribe({
      next: (data) => {
        this.entries.set((data ?? []).map((s) => ({ student_id: s.id, name: s.name, status: 'present', remarks: '' })));
        this.loadingStudents.set(false);
      },
      error: () => { this.toast.error('Failed to load students'); this.loadingStudents.set(false); },
    });
  }

  markAll(status: string) {
    this.entries.update((arr) => arr.map((e) => ({ ...e, status })));
  }

  setStatus(studentId: string, status: string) {
    this.entries.update((arr) => arr.map((e) => e.student_id === studentId ? { ...e, status } : e));
  }

  setRemarks(studentId: string, remarks: string) {
    this.entries.update((arr) => arr.map((e) => e.student_id === studentId ? { ...e, remarks } : e));
  }

  get presentCount() { return this.entries().filter((e) => e.status === 'present').length; }
  get absentCount() { return this.entries().filter((e) => e.status === 'absent').length; }

  submit() {
    if (!this.selectedClass || !this.entries().length) return;
    this.saving.set(true);
    const payload = {
      class_id: this.selectedClass,
      date: this.date,
      entries: this.entries().map(({ student_id, status, remarks }) => ({ student_id, status, remarks })),
    };
    this.api.post('attendance/mark', payload).subscribe({
      next: () => {
        this.toast.success('Attendance marked successfully!');
        this.saving.set(false);
        this.submitted.set(true);
        setTimeout(() => this.submitted.set(false), 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to mark attendance');
        this.saving.set(false);
      },
    });
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}
