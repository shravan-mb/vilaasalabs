import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-proctor-performance',
  standalone: true,
  imports: [],
  templateUrl: './proctor-performance.html',
  styleUrl: './proctor-performance.scss',
})
export class ProctorPerformancePage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  rows = signal<any[]>([]);
  loading = signal(true);

  get alerts() { return this.rows().filter((r) => r.low_attendance); }

  ngOnInit() {
    const teacherId = this.auth.currentUser()?.id;
    const instId = this.auth.institutionId;
    if (!teacherId || !instId) return;

    this.http.get<any[]>(`${environment.apiUrl}/institutions/${instId}/users/proctor/${teacherId}/performance`).subscribe({
      next: (res) => { this.rows.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load performance data'); this.loading.set(false); },
    });
  }
}
