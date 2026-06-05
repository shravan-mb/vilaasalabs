import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './announcements.html',
  styleUrl: './announcements.scss',
})
export class AnnouncementsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  deleteTarget = signal<any>(null);
  saving = signal(false);

  form = { title: '', body: '', target_role: 'all' };

  dateStr(val: string) { return val ? val.substring(0, 10) : ''; }
  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/announcements`).subscribe({
      next: (res) => { this.items.set(res); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load'); this.loading.set(false); },
    });
  }

  save() {
    if (!this.form.title.trim() || !this.form.body.trim()) { this.toast.error('Title and message required'); return; }
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/announcements`, this.form).subscribe({
      next: () => { this.toast.success('Announcement posted'); this.showForm.set(false); this.form = { title: '', body: '', target_role: 'all' }; this.load(); this.saving.set(false); },
      error: () => { this.toast.error('Failed to post'); this.saving.set(false); },
    });
  }

  doDelete() {
    this.http.delete(`${environment.apiUrl}/announcements/${this.deleteTarget()!.id}`).subscribe({
      next: () => { this.toast.success('Deleted'); this.deleteTarget.set(null); this.load(); },
      error: () => { this.toast.error('Failed'); this.deleteTarget.set(null); },
    });
  }
}
