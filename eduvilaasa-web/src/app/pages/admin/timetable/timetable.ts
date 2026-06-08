import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-admin-timetable',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './timetable.html',
  styleUrl: './timetable.scss',
})
export class AdminTimetablePage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  classes = signal<any[]>([]);
  teachers = signal<any[]>([]);
  slots = signal<any[]>([]);
  loading = signal(true);
  saving = signal(false);

  filterClassId = signal('');
  days = DAYS;

  form = {
    class_id: '',
    subject_name: '',
    teacher_id: '',
    day_of_week: 0,
    start_time: '',
    end_time: '',
  };
  showForm = signal(false);

  private get base() { return `${environment.apiUrl}`; }
  private get instBase() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}`; }

  filteredSlots = computed(() => {
    const all = this.slots();
    const cls = this.filterClassId();
    if (!cls) return all;
    return all.filter((s) => s.class_id === cls);
  });

  ngOnInit() {
    this.http.get<any[]>(`${this.instBase}/classes`).subscribe({ next: (res) => this.classes.set(res ?? []) });
    this.http.get<any>(`${this.instBase}/users?role=teacher&limit=100`).subscribe({
      next: (res) => this.teachers.set((res.data ?? res) ?? []),
    });
    this.loadSlots();
  }

  loadSlots() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.base}/timetable`).subscribe({
      next: (res) => { this.slots.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load timetable'); this.loading.set(false); },
    });
  }

  slotsForDay(classId: string, day: number) {
    return this.filteredSlots().filter((s) => s.class_id === classId && s.day_of_week === day);
  }

  className(classId: string) {
    const c = this.classes().find((x) => x.id === classId);
    return c ? `${c.name}${c.section ? ' – ' + c.section : ''}` : classId;
  }

  teacherName(teacherId: string) {
    return this.teachers().find((t) => t.id === teacherId)?.name ?? '—';
  }

  uniqueClassIds(): string[] {
    return [...new Set(this.filteredSlots().map((s: any) => s.class_id as string))];
  }

  subjectsForForm(): any[] {
    if (!this.form.class_id) return [];
    const cls = this.classes().find((c) => c.id === this.form.class_id);
    return cls?.subjects ?? [];
  }

  onClassChange() {
    this.form.subject_name = '';
  }

  openForm() {
    this.form = { class_id: '', subject_name: '', teacher_id: '', day_of_week: 0, start_time: '', end_time: '' };
    this.showForm.set(true);
  }

  saveSlot() {
    if (!this.form.class_id || !this.form.subject_name || !this.form.start_time || !this.form.end_time) {
      this.toast.error('Class, subject, and times are required');
      return;
    }
    this.saving.set(true);
    const body: any = {
      class_id: this.form.class_id,
      subject_name: this.form.subject_name,
      day_of_week: Number(this.form.day_of_week),
      start_time: this.form.start_time,
      end_time: this.form.end_time,
    };
    if (this.form.teacher_id) body.teacher_id = this.form.teacher_id;

    this.http.post<any>(`${this.base}/timetable`, body).subscribe({
      next: (slot) => {
        this.slots.update((arr) => [...arr, slot]);
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success('Slot added');
      },
      error: () => { this.toast.error('Failed to save slot'); this.saving.set(false); },
    });
  }

  deleteSlot(id: string) {
    if (!confirm('Delete this timetable slot?')) return;
    this.http.delete(`${this.base}/timetable/${id}`).subscribe({
      next: () => { this.slots.update((arr) => arr.filter((s) => s.id !== id)); this.toast.success('Slot deleted'); },
      error: () => this.toast.error('Failed to delete slot'),
    });
  }
}
