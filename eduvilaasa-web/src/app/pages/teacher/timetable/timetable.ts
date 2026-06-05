import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
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
export class TeacherTimetablePage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  slots = signal<any[]>([]);
  loading = signal(true);
  days = DAYS;

  slotsForDay(day: number): any[] { return this.slots().filter((s) => s.day_of_week === day); }

  ngOnInit() {
    this.http.get<any[]>(`${environment.apiUrl}/timetable/teacher`).subscribe({
      next: (res) => { this.slots.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load schedule'); this.loading.set(false); },
    });
  }
}
