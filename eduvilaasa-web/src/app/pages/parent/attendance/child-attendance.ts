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

  children          = signal<any[]>([]);
  selectedStudentId = signal('');
  timeline          = signal<{ summary: any; days: any[] } | null>(null);
  loading           = signal(false);
  loadingChildren   = signal(true);

  from = this.monthStart();
  to   = this.today();

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.api.get<any[]>(`users/${userId}/children`).subscribe({
      next: (data) => {
        this.children.set(data ?? []);
        this.loadingChildren.set(false);
        if (data?.length === 1) {
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
    this.timeline.set(null);
    this.api.get<any>(`attendance/child/${sid}/timeline`, { from: this.from, to: this.to }).subscribe({
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
