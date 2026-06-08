import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './staff.html',
  styleUrl: './staff.scss',
})
export class StaffPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  staff = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  deleteTarget = signal<any>(null);
  saving = signal(false);

  form = { name: '', email: '', phone: '', password: '', department: '' };

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '', department: '' };
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  private get base() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}/users`; }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.base}?role=institution_staff&limit=100`).subscribe({
      next: (res) => { this.staff.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load staff'); this.loading.set(false); },
    });
  }

  openForm() { this.form = { name: '', email: '', phone: '', password: '', department: '' }; this.showForm.set(true); }

  save() {
    if (!this.form.name || !this.form.password) { this.toast.error('Name and password are required'); return; }
    this.saving.set(true);
    const payload: any = { name: this.form.name, phone: this.form.phone, password: this.form.password, role: 'institution_staff' };
    if (this.form.email) payload.email = this.form.email;
    if (this.form.department) payload.department = this.form.department;
    this.http.post(this.base, payload).subscribe({
      next: () => { this.toast.success('Staff member added'); this.showForm.set(false); this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to add staff'); this.saving.set(false); },
    });
  }

  openEdit(m: any) {
    this.editForm = { name: m.name, email: m.email ?? '', phone: m.phone ?? '', department: m.department ?? '' };
    this.editTarget.set(m);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = { name: this.editForm.name, phone: this.editForm.phone };
    if (this.editForm.email) payload.email = this.editForm.email;
    if (this.editForm.department) payload.department = this.editForm.department;
    this.http.patch(`${this.base}/${this.editTarget().id}`, payload).subscribe({
      next: () => {
        this.toast.success('Staff member updated');
        this.editTarget.set(null);
        this.editSaving.set(false);
        this.load();
      },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to update'); this.editSaving.set(false); },
    });
  }

  openResetPassword(m: any) { this.newPassword = ''; this.passwordTarget.set(m); }

  savePassword() {
    if (this.newPassword.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.passwordSaving.set(true);
    this.http.patch(`${this.base}/${this.passwordTarget().id}/set-password`, { new_password: this.newPassword }).subscribe({
      next: () => { this.toast.success('Password updated'); this.passwordTarget.set(null); this.passwordSaving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to update password'); this.passwordSaving.set(false); },
    });
  }

  confirmDelete(member: any) { this.deleteTarget.set(member); }

  doDelete() {
    this.http.delete(`${this.base}/${this.deleteTarget()!.id}`).subscribe({
      next: () => { this.toast.success('Staff member removed'); this.deleteTarget.set(null); this.load(); },
      error: () => { this.toast.error('Failed to delete'); this.deleteTarget.set(null); },
    });
  }
}
