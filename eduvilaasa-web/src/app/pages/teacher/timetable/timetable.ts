import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-teacher-timetable',
  standalone: true,
  imports: [],
  templateUrl: './timetable.html',
  styleUrl: './timetable.scss',
})
export class TeacherTimetablePage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  slots = signal<any[]>([]);
  classes = signal<any[]>([]);
  loading = signal(true);
  days = DAYS;

  readonly todayDayIndex = (new Date().getDay() + 6) % 7;
  readonly liveMinutes   = signal(new Date().getHours() * 60 + new Date().getMinutes());
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  slotsForDay(day: number): any[] { return this.slots().filter((s) => s.day_of_week === day); }

  className(classId: string): string {
    const c = this.classes().find((x) => x.id === classId);
    return c ? `${c.name}${c.section ? ' – ' + c.section : ''}` : '—';
  }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/institutions/${this.auth.institutionId}/classes`).subscribe({
      next: (res) => this.classes.set((res ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))),
    });
    this.http.get<any[]>(`${environment.apiUrl}/timetable/teacher`).subscribe({
      next: (res) => { this.slots.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load schedule'); this.loading.set(false); },
    });
    this.tickInterval = setInterval(() => {
      const n = new Date();
      this.liveMinutes.set(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
  }

  ngOnDestroy() { if (this.tickInterval) clearInterval(this.tickInterval); }

  isPastDay(d: number): boolean { return d < this.todayDayIndex; }
  isToday(d:  number): boolean  { return d === this.todayDayIndex; }

  slotState(slot: any, d: number): 'past' | 'live' | 'future' {
    if (d < this.todayDayIndex) return 'past';
    if (d > this.todayDayIndex) return 'future';
    const now = this.liveMinutes();
    const [eh, em] = slot.end_time.split(':').map(Number);
    if (now >= eh * 60 + em) return 'past';
    const [sh, sm] = slot.start_time.split(':').map(Number);
    if (now >= sh * 60 + sm) return 'live';
    return 'future';
  }
}
