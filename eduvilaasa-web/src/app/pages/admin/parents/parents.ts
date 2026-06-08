import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-parents',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, ConfirmDialogComponent],
  templateUrl: './parents.html',
  styleUrl: './parents.scss',
})
export class ParentsPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  parents = signal<any[]>([]);
  students = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  showLink = signal(false);
  deleteTarget = signal<any>(null);
  saving = signal(false);

  form = { name: '', email: '', phone: '', password: '' };
  linkForm = { parent_id: '', student_id: '', relationship: 'guardian' };

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '' };
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  private get base() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}/users`; }
  private get studentBase() { return `${environment.apiUrl}/institutions/${this.auth.institutionId}/students`; }

  ngOnInit() { this.load(); this.loadStudents(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${this.base}?role=parent&limit=100`).subscribe({
      next: (res) => { this.parents.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load parents'); this.loading.set(false); },
    });
  }

  loadStudents() {
    this.http.get<any>(`${this.base}?role=student&limit=200`).subscribe({
      next: (res) => this.students.set(res.data ?? res),
    });
  }

  save() {
    if (!this.form.name || !this.form.phone || !this.form.password) {
      this.toast.error('Name, phone and password are required');
      return;
    }
    this.saving.set(true);
    const payload: any = { name: this.form.name, phone: this.form.phone, password: this.form.password, role: 'parent' };
    if (this.form.email) payload.email = this.form.email;
    this.http.post(this.base, payload).subscribe({
      next: () => { this.toast.success('Parent added'); this.showForm.set(false); this.form = { name: '', email: '', phone: '', password: '' }; this.load(); this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to add parent'); this.saving.set(false); },
    });
  }

  linkParent() {
    if (!this.linkForm.parent_id || !this.linkForm.student_id) { this.toast.error('Select both parent and student'); return; }
    this.saving.set(true);
    this.http.post(`${this.studentBase}/${this.linkForm.student_id}/parents`, {
      parent_id: this.linkForm.parent_id,
      relationship: this.linkForm.relationship,
    }).subscribe({
      next: () => { this.toast.success('Parent linked to student'); this.showLink.set(false); this.linkForm = { parent_id: '', student_id: '', relationship: 'guardian' }; this.saving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to link'); this.saving.set(false); },
    });
  }

  openEdit(p: any) {
    this.editForm = { name: p.name, email: p.email ?? '', phone: p.phone ?? '' };
    this.editTarget.set(p);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = { name: this.editForm.name, phone: this.editForm.phone };
    if (this.editForm.email) payload.email = this.editForm.email;
    this.http.patch(`${this.base}/${this.editTarget().id}`, payload).subscribe({
      next: () => {
        this.toast.success('Parent updated');
        this.editTarget.set(null);
        this.editSaving.set(false);
        this.load();
      },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to update'); this.editSaving.set(false); },
    });
  }

  openResetPassword(p: any) { this.newPassword = ''; this.passwordTarget.set(p); }

  savePassword() {
    if (this.newPassword.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.passwordSaving.set(true);
    this.http.patch(`${this.base}/${this.passwordTarget().id}/set-password`, { new_password: this.newPassword }).subscribe({
      next: () => { this.toast.success('Password updated'); this.passwordTarget.set(null); this.passwordSaving.set(false); },
      error: (e) => { this.toast.error(e.error?.message || 'Failed to update password'); this.passwordSaving.set(false); },
    });
  }

  confirmDelete(p: any) { this.deleteTarget.set(p); }
  doDelete() {
    this.http.delete(`${this.base}/${this.deleteTarget()!.id}`).subscribe({
      next: () => { this.toast.success('Parent removed'); this.deleteTarget.set(null); this.load(); },
      error: () => { this.toast.error('Failed to delete'); this.deleteTarget.set(null); },
    });
  }
}
