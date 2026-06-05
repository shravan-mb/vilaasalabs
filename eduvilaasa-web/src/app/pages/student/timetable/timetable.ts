import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
          <div class="day-col">
            <div class="day-header">{{ day }}</div>
            @for (slot of slotsForDay(d); track slot.id) {
              <div class="slot-card">
                <div class="slot-subject">{{ slot.subject_name }}</div>
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
    .day-header { font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px; }
    .slot-card { background:#1a0a2e;border:1px solid #2d1460;border-radius:8px;padding:10px;margin-bottom:8px; }
    .slot-subject { font-size:13px;font-weight:600;color:#fff; }
    .slot-time { font-size:11px;color:#a78bfa;margin-top:3px; }
    .slot-teacher { font-size:11px;color:#666;margin-top:2px; }
    .slot-empty { color:#333;font-size:12px;text-align:center;padding:8px; }
    @media(max-width:900px){.timetable-grid{grid-template-columns:repeat(3,1fr);}}
    @media(max-width:500px){.timetable-grid{grid-template-columns:1fr;}}
  `],
})
export class StudentTimetablePage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  slots = signal<any[]>([]);
  loading = signal(true);
  days = DAYS;

  ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;
    // Students need their class_id — fetch from profile
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
  }

  slotsForDay(day: number) { return this.slots().filter((s) => s.day_of_week === day); }
}
