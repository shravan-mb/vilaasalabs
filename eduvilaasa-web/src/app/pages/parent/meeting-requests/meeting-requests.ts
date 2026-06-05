import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-parent-meeting-requests',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './meeting-requests.html',
  styleUrl: './meeting-requests.scss',
})
export class ParentMeetingRequestsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  requests = signal<any[]>([]);
  children = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);

  form = { student_id: '', message: '', proposed_date: '' };

  private get base() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}/users`; }

  ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    // Load children for the form dropdown
    this.http.get<any[]>(`${this.base}/${userId}/children`).subscribe({
      next: (res) => this.children.set(res ?? []),
    });
    this.loadRequests();
  }

  loadRequests() {
    this.loading.set(true);
    this.http.get<any[]>(`${this.base}/meeting-requests/my-requests`).subscribe({
      next: (res) => { this.requests.set(res ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load requests'); this.loading.set(false); },
    });
  }

  submitRequest() {
    if (!this.form.student_id || !this.form.message.trim()) {
      this.toast.error('Please select a child and enter a message');
      return;
    }
    this.saving.set(true);
    const body: any = { student_id: this.form.student_id, message: this.form.message };
    if (this.form.proposed_date) body.proposed_date = this.form.proposed_date;

    this.http.post<any>(`${this.base}/meeting-requests`, body).subscribe({
      next: (req) => {
        this.requests.update((arr) => [req, ...arr]);
        this.form = { student_id: '', message: '', proposed_date: '' };
        this.showForm.set(false);
        this.saving.set(false);
        this.toast.success('Meeting request sent to proctor');
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to send request');
        this.saving.set(false);
      },
    });
  }

  statusClass(s: string) {
    return { pending: 'badge-gray', accepted: 'badge-success', declined: 'badge-error' }[s] ?? 'badge-gray';
  }
}
