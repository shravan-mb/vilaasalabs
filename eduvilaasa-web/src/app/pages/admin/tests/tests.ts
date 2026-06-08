import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-tests',
  standalone: true,
  templateUrl: './tests.html',
  styleUrl: './tests.scss',
})
export class TestsPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  tests = signal<any[]>([]);
  classes = signal<any[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.api.get<any[]>('classes').subscribe({ next: (data) => this.classes.set(data ?? []) });
    this.api.get<any[]>('tests').subscribe({
      next: (data) => { this.tests.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  statusClass(s: string) {
    return { draft: 'badge-gray', published: 'badge-green', closed: 'badge-red' }[s] ?? 'badge-gray';
  }

  className(classId: string | null): string {
    if (!classId) return 'All Classes';
    const c = this.classes().find((x) => x.id === classId);
    return c ? `${c.name}${c.section ? ' – ' + c.section : ''}` : classId;
  }

  changeStatus(id: string, status: string) {
    this.api.patch(`tests/${id}/status`, { status }).subscribe({ next: () => {
      this.tests.update((arr) => arr.map((t) => t.id === id ? { ...t, status } : t));
    }});
  }
}
