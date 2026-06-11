import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './mark-attendance.html',
  styleUrl: './mark-attendance.scss',
})
export class MarkAttendance implements OnInit {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  private get instBase() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}`; }

  // Weekly timetable slots for this teacher
  allSlots = signal<any[]>([]);
  slotsLoading = signal(true);

  // Active slot being marked (null = schedule overview)
  activeSlot = signal<any>(null);

  // Manual mode (no timetable / off-schedule)
  manualMode = signal(false);
  classes = signal<any[]>([]);
  manualClassId = '';
  manualSubject = '';

  // Attendance form state
  entries = signal<Array<{ student_id: string; attendance_id: string | null; name: string; status: string; remarks: string }>>([]);
  loadingStudents = signal(false);
  saving = signal(false);
  isEditMode = signal(false);

  date = new Date().toISOString().split('T')[0];

  private classMap = new Map<string, string>();

  get formattedDate(): string {
    const d = new Date(this.date + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Filter all slots to today's (or selected date's) day_of_week
  get todaySlots(): any[] {
    const dow = new Date(this.date + 'T00:00:00').getDay();
    return this.allSlots()
      .filter(s => s.day_of_week === dow)
      .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  }

  ngOnInit() {
    this.api.get<any[]>('timetable/teacher').subscribe({
      next: slots => { this.allSlots.set(slots ?? []); this.slotsLoading.set(false); },
      error: () => this.slotsLoading.set(false),
    });

    this.api.get<any[]>('classes').subscribe(data => {
      const sorted = (data ?? []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      this.classes.set(sorted);
      sorted.forEach((c: any) => this.classMap.set(c.id, c.name + (c.section ? ' — ' + c.section : '')));
    });
  }

  className(classId: string): string {
    return this.classMap.get(classId) ?? '...';
  }

  onDateChange() {
    // If a slot is open and the class changes day, go back to schedule view
    this.back();
  }

  selectSlot(slot: any) {
    this.activeSlot.set(slot);
    this.manualMode.set(false);
    this.loadForClass(slot.class_id, slot.subject_name);
  }

  activateManual() {
    this.manualMode.set(true);
    this.activeSlot.set(null);
    this.entries.set([]);
  }

  loadManual() {
    if (!this.manualClassId) { this.toast.warning('Select a class first'); return; }
    this.loadForClass(this.manualClassId, this.manualSubject.trim() || undefined);
  }

  private loadForClass(classId: string, subjectName?: string) {
    this.loadingStudents.set(true);
    this.entries.set([]);
    this.isEditMode.set(false);

    const subjectParam = subjectName ? `?subject=${encodeURIComponent(subjectName)}` : '';

    forkJoin([
      this.api.get<any[]>(`users/class/${classId}`),
      this.http.get<any[]>(`${this.instBase}/attendance/class/${classId}/date/${this.date}${subjectParam}`),
    ]).subscribe({
      next: ([students, existing]) => {
        const existingMap = new Map<string, any>((existing ?? []).map(r => [r.student_id, r]));
        const isEdit = (existing ?? []).length > 0;
        this.isEditMode.set(isEdit);
        this.entries.set(
          (students ?? []).map((s: any) => {
            const ex = existingMap.get(s.id);
            return {
              student_id: s.id,
              attendance_id: ex?.id ?? null,
              name: s.name,
              status: ex?.status ?? 'present',
              remarks: ex?.remarks ?? '',
            };
          })
        );
        this.loadingStudents.set(false);
      },
      error: () => {
        this.toast.error('Failed to load students');
        this.loadingStudents.set(false);
      },
    });
  }

  markAll(status: string) {
    this.entries.update(arr => arr.map(e => ({ ...e, status })));
  }

  setStatus(studentId: string, status: string) {
    this.entries.update(arr => arr.map(e => e.student_id === studentId ? { ...e, status } : e));
  }

  setRemarks(studentId: string, remarks: string) {
    this.entries.update(arr => arr.map(e => e.student_id === studentId ? { ...e, remarks } : e));
  }

  get presentCount() { return this.entries().filter(e => e.status === 'present').length; }
  get absentCount() { return this.entries().filter(e => e.status === 'absent').length; }

  submit() {
    const slot = this.activeSlot();
    const classId = slot?.class_id ?? this.manualClassId;
    const subjectName = slot?.subject_name ?? (this.manualSubject.trim() || undefined);
    if (!classId || !this.entries().length) return;

    this.saving.set(true);

    if (this.isEditMode()) {
      // PATCH each existing record
      const updates = this.entries()
        .filter(e => e.attendance_id)
        .map(e => this.http.patch(`${this.instBase}/attendance/${e.attendance_id}`, { status: e.status, remarks: e.remarks }));

      if (!updates.length) { this.saving.set(false); return; }

      forkJoin(updates).subscribe({
        next: () => {
          this.toast.success('Attendance updated successfully!');
          this.saving.set(false);
          this.back();
        },
        error: () => { this.toast.error('Failed to update attendance'); this.saving.set(false); },
      });
    } else {
      const payload: any = {
        class_id: classId,
        date: this.date,
        entries: this.entries().map(({ student_id, status, remarks }) => ({ student_id, status, remarks })),
      };
      if (subjectName) payload.subject_name = subjectName;

      this.api.post('attendance/mark', payload).subscribe({
        next: () => {
          this.toast.success('Attendance marked successfully!');
          this.saving.set(false);
          this.isEditMode.set(true);
          this.back();
        },
        error: (err: any) => {
          this.toast.error(err.error?.message || 'Failed to mark attendance');
          this.saving.set(false);
        },
      });
    }
  }

  back() {
    this.activeSlot.set(null);
    this.manualMode.set(false);
    this.entries.set([]);
    this.isEditMode.set(false);
  }
}
