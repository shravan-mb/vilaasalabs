import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-academic-years',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './academic-years.html',
  styleUrl: './academic-years.scss',
})
export class AcademicYearsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  years = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  deleteTarget = signal<any>(null);
  saving = signal(false);

  form = { name: '', start_date: '', end_date: '' };

  editTarget = signal<any>(null);
  editForm = { name: '', start_date: '', end_date: '' };
  editSaving = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/academic-years`).subscribe({
      next: (res) => { this.years.set(res); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load'); this.loading.set(false); },
    });
  }

  save() {
    if (!this.form.name || !this.form.start_date || !this.form.end_date) { this.toast.error('All fields required'); return; }
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/academic-years`, this.form).subscribe({
      next: () => { this.toast.success('Academic year created'); this.showForm.set(false); this.form = { name: '', start_date: '', end_date: '' }; this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed'); this.saving.set(false); },
    });
  }

  openEdit(y: any) {
    this.editForm = { name: y.name, start_date: y.start_date, end_date: y.end_date };
    this.editTarget.set(y);
  }

  saveEdit() {
    if (!this.editForm.name || !this.editForm.start_date || !this.editForm.end_date) { this.toast.error('All fields required'); return; }
    this.editSaving.set(true);
    this.http.patch(`${environment.apiUrl}/academic-years/${this.editTarget()!.id}`, this.editForm).subscribe({
      next: () => { this.toast.success('Updated'); this.editTarget.set(null); this.editSaving.set(false); this.load(); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed'); this.editSaving.set(false); },
    });
  }

  activate(y: any) {
    this.http.post(`${environment.apiUrl}/academic-years/${y.id}/activate`, {}).subscribe({
      next: () => { this.toast.success(`${y.name} set as current year`); this.load(); },
      error: () => this.toast.error('Failed to activate'),
    });
  }

  doDelete() {
    this.http.delete(`${environment.apiUrl}/academic-years/${this.deleteTarget()!.id}`).subscribe({
      next: () => { this.toast.success('Deleted'); this.deleteTarget.set(null); this.load(); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed'); this.deleteTarget.set(null); },
    });
  }
}
