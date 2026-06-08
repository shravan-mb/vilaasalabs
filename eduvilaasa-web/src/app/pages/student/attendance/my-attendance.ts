import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-attendance',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './my-attendance.html',
})
export class MyAttendance implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  records = signal<any[]>([]);
  summary = signal<any>(null);
  loading = signal(false);

  from = this.monthStart();
  to = this.today();

  ngOnInit() { this.load(); }

  load() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.loading.set(true);
    this.api.get<any[]>('attendance/my', { from_date: this.from, to_date: this.to }).subscribe({
      next: (data) => { this.records.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>(`attendance/student/${userId}/summary`, { from: this.from, to: this.to }).subscribe({
      next: (data) => this.summary.set(data),
    });
  }

  statusClass(s: string) {
    return { present: 'badge-green', absent: 'badge-red', late: 'badge-yellow', holiday: 'badge-gray' }[s] ?? 'badge-gray';
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private monthStart(): string { const t = this.today(); return t.substring(0, 8) + '01'; }
}
