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
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  timeline = signal<{ summary: any; days: any[] } | null>(null);
  loading  = signal(false);

  from = this.monthStart();
  to   = this.today();

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.timeline.set(null);
    this.api.get<any>('attendance/my/timeline', { from: this.from, to: this.to }).subscribe({
      next: (data) => { this.timeline.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  subjectClass(status: string): string {
    return { present: 'pill-present', absent: 'pill-absent', late: 'pill-late', holiday: 'pill-holiday' }[status] ?? 'pill-default';
  }

  formatDate(d: string): string {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private monthStart(): string { const t = this.today(); return t.substring(0, 8) + '01'; }
}
