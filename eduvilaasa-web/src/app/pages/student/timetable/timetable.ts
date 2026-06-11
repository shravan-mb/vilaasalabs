import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-student-timetable',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="page-header"><div><h1>Timetable</h1><p>Your weekly class schedule</p></div></div>
    @if (loading()) { <div class="card"><app-skeleton [lines]="6"/></div> }
    @else if (!slots().length) { <div class="card"><div class="empty-state">No timetable set up yet. Ask your admin to configure it.</div></div> }
    @else {
      <div class="timetable-grid">
        @for (day of days; track $index; let d = $index) {
          <div class="day-col" [class.day-col-past]="isPastDay(d)" [class.day-col-today]="isToday(d)">
            <div class="day-header">
              {{ day }}
              @if (isToday(d)) { <span class="day-today-dot"></span> }
            </div>
            @for (slot of slotsForDay(d); track slot.id) {
              <div class="slot-card" [class.slot-past]="slotState(slot, d) === 'past'" [class.slot-live]="slotState(slot, d) === 'live'">
                <div class="slot-subject">
                  {{ slot.subject_name }}
                  @if (slotState(slot, d) === 'live') { <span class="slot-now-badge">NOW</span> }
                </div>
                <div class="slot-time">{{ slot.start_time }} – {{ slot.end_time }}</div>
                @if (slot.teacher_name) { <div class="slot-teacher">{{ slot.teacher_name }}</div> }
              </div>
            }
            @if (!slotsForDay(d).length) { <div class="slot-empty">—</div> }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .timetable-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:12px; }
    .day-header { font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;display:flex;align-items:center;gap:5px; }
    .day-today-dot { display:inline-block;width:7px;height:7px;background:#22c55e;border-radius:50%;flex-shrink:0; }
    .day-col-past  .day-header { opacity:0.45; }
    .day-col-today .day-header { color:#22c55e; }
    .slot-card { background:#1a0a2e;border:1px solid #2d1460;border-radius:8px;padding:10px;margin-bottom:8px; }
    .slot-card.slot-past { opacity:0.38;filter:grayscale(55%); }
    .slot-card.slot-live { border-color:#22c55e;background:#071a0b;box-shadow:0 0 14px rgba(34,197,94,0.28); }
    .slot-subject { font-size:13px;font-weight:600;color:#fff;display:flex;align-items:center;flex-wrap:wrap;gap:4px; }
    .slot-now-badge { font-size:9px;font-weight:800;background:#22c55e;color:#fff;padding:1px 5px;border-radius:3px;animation:slot-pulse 1.6s ease-in-out infinite; }
    @keyframes slot-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    .slot-time { font-size:11px;color:#a78bfa;margin-top:3px; }
    .slot-teacher { font-size:11px;color:#666;margin-top:2px; }
    .slot-empty { color:#333;font-size:12px;text-align:center;padding:8px; }
    @media(max-width:900px){.timetable-grid{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:500px){.timetable-grid{grid-template-columns:1fr;}}
  `],
})
export class StudentTimetablePage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  slots = signal<any[]>([]);
  loading = signal(true);
  days = DAYS;

  readonly todayDayIndex = (new Date().getDay() + 6) % 7;
  readonly liveMinutes   = signal(new Date().getHours() * 60 + new Date().getMinutes());
  private tickInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    this.http.get<any>(`${environment.apiUrl}/profile`).subscribe({
      next: (profile) => {
        if (!profile.class_id) { this.loading.set(false); return; }
        this.http.get<any[]>(`${environment.apiUrl}/timetable/class/${profile.class_id}`).subscribe({
          next: (res) => { this.slots.set(res); this.loading.set(false); },
          error: () => { this.toast.error('Failed to load timetable'); this.loading.set(false); },
        });
      },
      error: () => this.loading.set(false),
    });
    this.tickInterval = setInterval(() => {
      const n = new Date();
      this.liveMinutes.set(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
  }

  ngOnDestroy() { if (this.tickInterval) clearInterval(this.tickInterval); }

  slotsForDay(day: number) { return this.slots().filter((s) => s.day_of_week === day); }

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
