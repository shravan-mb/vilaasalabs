import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-child-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './child-attendance.html',
})
export class ChildAttendance implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  links = signal<any[]>([]);
  selectedStudentId = signal('');
  records = signal<any[]>([]);
  summary = signal<any>(null);
  loading = signal(false);

  from = this.monthStart();
  to = this.today();

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    // The backend StudentParent service stores parent→student links
    // We query students linked to this parent by querying their linked students list
    this.api.get<any[]>('users', { role: 'student' }).subscribe({
      next: (data) => { this.links.set(data); },
    });
  }

  load() {
    const sid = this.selectedStudentId();
    if (!sid) return;
    this.loading.set(true);
    this.api.get<any[]>('attendance', { student_id: sid, from_date: this.from, to_date: this.to }).subscribe({
      next: (data) => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>(`attendance/student/${sid}/summary`, { from: this.from, to: this.to }).subscribe({
      next: (data) => this.summary.set(data),
    });
  }

  statusClass(s: string) {
    return { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', holiday: 'badge-gray' }[s] ?? 'badge-gray';
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private monthStart(): string { const t = this.today(); return t.substring(0, 8) + '01'; }
}
