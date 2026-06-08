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
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  children  = signal<any[]>([]);
  selectedStudentId = signal('');
  records   = signal<any[]>([]);
  summary   = signal<any>(null);
  loading   = signal(false);
  loadingChildren = signal(true);

  from = this.monthStart();
  to   = this.today();

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    // Load only THIS parent's linked children (not all institution students)
    this.api.get<any[]>(`users/${userId}/children`).subscribe({
      next: (data) => {
        this.children.set(data ?? []);
        this.loadingChildren.set(false);
        if (data?.length === 1) {
          // Auto-select and auto-load if only one child
          this.selectedStudentId.set(data[0].id);
          this.load();
        }
      },
      error: () => this.loadingChildren.set(false),
    });
  }

  load() {
    const sid = this.selectedStudentId();
    if (!sid) return;
    this.loading.set(true);
    this.summary.set(null);
    this.records.set([]);

    this.api.get<any[]>(`attendance/child/${sid}`, { from_date: this.from, to_date: this.to }).subscribe({
      next: (data) => { this.records.set(data ?? []); this.loading.set(false); },
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
