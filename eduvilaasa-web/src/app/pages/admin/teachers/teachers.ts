import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class TeachersPage implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  teachers = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');

  form = { name: '', email: '', phone: '', password: '', role: 'teacher' };
  touched: Record<string, boolean> = {};

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '' };
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any>('users', { role: 'teacher', limit: '200' }).subscribe({
      next: (res: any) => { this.teachers.set(res.data ?? res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  touch(f: string) { this.touched[f] = true; }
  isInvalid(f: string): boolean {
    if (!this.touched[f]) return false;
    if (f === 'name') return !this.form.name.trim();
    if (f === 'email') return !!this.form.email && !this.form.email.includes('@');
    if (f === 'password') return this.form.password.length < 8;
    return false;
  }

  onSubmit() {
    ['name', 'password'].forEach((f) => this.touch(f));
    if (['name', 'password'].some((f) => this.isInvalid(f))) return;
    if (this.form.email) { this.touch('email'); if (this.isInvalid('email')) return; }
    this.saving.set(true);
    this.error.set('');
    const payload: any = { name: this.form.name, phone: this.form.phone, password: this.form.password, role: 'teacher' };
    if (this.form.email) payload.email = this.form.email;
    this.api.post('users', payload).subscribe({
      next: () => {
        this.toast.success('Teacher added successfully');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { name: '', email: '', phone: '', password: '', role: 'teacher' };
        this.touched = {};
        this.load();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to add teacher');
        this.saving.set(false);
        setTimeout(() => this.error.set(''), 4000);
      },
    });
  }

  openEdit(t: any) {
    this.editForm = { name: t.name, email: t.email ?? '', phone: t.phone ?? '' };
    this.editTarget.set(t);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = { name: this.editForm.name, phone: this.editForm.phone };
    if (this.editForm.email) payload.email = this.editForm.email;
    this.api.patch(`users/${this.editTarget().id}`, payload).subscribe({
      next: () => {
        this.toast.success('Teacher updated');
        this.editTarget.set(null);
        this.editSaving.set(false);
        this.load();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update');
        this.editSaving.set(false);
      },
    });
  }

  openResetPassword(t: any) { this.newPassword = ''; this.passwordTarget.set(t); }

  savePassword() {
    if (this.newPassword.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.passwordSaving.set(true);
    this.api.patch(`users/${this.passwordTarget().id}/set-password`, { new_password: this.newPassword }).subscribe({
      next: () => {
        this.toast.success('Password updated');
        this.passwordTarget.set(null);
        this.passwordSaving.set(false);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update password');
        this.passwordSaving.set(false);
      },
    });
  }

  deactivate(id: string) {
    this.api.patch(`users/${id}/deactivate`, {}).subscribe({ next: () => this.load() });
  }

  activate(id: string) {
    this.api.patch(`users/${id}/activate`, {}).subscribe({ next: () => this.load() });
  }

  delete(id: string) {
    if (!confirm('Delete this teacher permanently?')) return;
    this.api.delete(`users/${id}`).subscribe({
      next: () => { this.toast.success('Teacher deleted'); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete'),
    });
  }
}
