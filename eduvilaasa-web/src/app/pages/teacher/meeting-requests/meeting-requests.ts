import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-teacher-meeting-requests',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './meeting-requests.html',
  styleUrl: './meeting-requests.scss',
})
export class TeacherMeetingRequestsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  requests = signal<any[]>([]);
  loading = signal(true);

  respondTarget = signal<any>(null);
  responseStatus = 'accepted';
  responseNote = '';
  responding = signal(false);

  private get base() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}/users`; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.base}/meeting-requests/incoming`).subscribe({
      next: (res) => { this.requests.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load requests'); this.loading.set(false); },
    });
  }

  openRespond(req: any) {
    this.respondTarget.set(req);
    this.responseStatus = 'accepted';
    this.responseNote = '';
  }

  submitResponse() {
    const req = this.respondTarget();
    if (!req) return;
    this.responding.set(true);
    this.http.patch(`${this.base}/meeting-requests/${req.id}/respond`, {
      status: this.responseStatus,
      response_note: this.responseNote || undefined,
    }).subscribe({
      next: (updated: any) => {
        this.requests.update((arr) => arr.map((r) => r.id === req.id ? updated : r));
        this.respondTarget.set(null);
        this.responding.set(false);
        this.toast.success('Response sent');
      },
      error: () => { this.toast.error('Failed to respond'); this.responding.set(false); },
    });
  }

  statusClass(s: string) {
    return { pending: 'badge-gray', accepted: 'badge-success', declined: 'badge-error' }[s] ?? 'badge-gray';
  }
}
