import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

type SubjectEntry = { class_id: string; class_name: string; subject_id: string; subject_name: string };

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss',
})
export class TeachersPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  teachers = signal<any[]>([]);
  classes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');

  form = { name: '', email: '', phone: '', password: 'Teacher@1234', role: 'teacher' };
  touched: Record<string, boolean> = {};
  teachingSubjectSelections: SubjectEntry[] = [];

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '' };
  editTeachingSubjectSelections: SubjectEntry[] = [];
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  ngOnInit() { this.load(); this.loadClasses(); }

  load() {
    this.loading.set(true);
    this.api.get<any>('users', { role: 'teacher', limit: '200' }).subscribe({
      next: (res: any) => {
        const list: any[] = res.data ?? res;
        this.teachers.set([...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadClasses() {
    this.api.get<any[]>('classes').subscribe({ next: (data) => this.classes.set(data ?? []) });
  }

  touch(f: string) { this.touched[f] = true; }
  isInvalid(f: string): boolean {
    if (!this.touched[f]) return false;
    if (f === 'name') return !this.form.name.trim();
    if (f === 'phone') return !this.form.phone.trim();
    if (f === 'email') return !!this.form.email && !this.form.email.includes('@');
    if (f === 'password') return this.form.password.length < 8;
    return false;
  }

  isSubjectSelected(subjectId: string): boolean {
    return this.teachingSubjectSelections.some(s => s.subject_id === subjectId);
  }

  toggleSubject(cls: any, sub: any): void {
    const idx = this.teachingSubjectSelections.findIndex(s => s.subject_id === sub.id);
    if (idx >= 0) {
      this.teachingSubjectSelections.splice(idx, 1);
    } else {
      this.teachingSubjectSelections.push({
        class_id: cls.id,
        class_name: `${cls.name}${cls.section ? ' — ' + cls.section : ''}`,
        subject_id: sub.id,
        subject_name: sub.name,
      });
    }
  }

  isEditSubjectSelected(subjectId: string): boolean {
    return this.editTeachingSubjectSelections.some(s => s.subject_id === subjectId);
  }

  toggleEditSubject(cls: any, sub: any): void {
    const idx = this.editTeachingSubjectSelections.findIndex(s => s.subject_id === sub.id);
    if (idx >= 0) {
      this.editTeachingSubjectSelections.splice(idx, 1);
    } else {
      this.editTeachingSubjectSelections.push({
        class_id: cls.id,
        class_name: `${cls.name}${cls.section ? ' — ' + cls.section : ''}`,
        subject_id: sub.id,
        subject_name: sub.name,
      });
    }
  }

  subjectSummary(subjects: SubjectEntry[] | undefined): string {
    if (!subjects || subjects.length === 0) return '—';
    const names = subjects.map(s => s.subject_name);
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2} more`;
  }

  onSubmit() {
    ['name', 'phone', 'password'].forEach((f) => this.touch(f));
    if (['name', 'phone', 'password'].some((f) => this.isInvalid(f))) return;
    if (this.form.email) { this.touch('email'); if (this.isInvalid('email')) return; }
    this.saving.set(true);
    this.error.set('');
    const payload: any = {
      name: this.form.name, phone: this.form.phone,
      password: this.form.password, role: 'teacher',
      teaching_subjects: this.teachingSubjectSelections,
    };
    if (this.form.email) payload.email = this.form.email;
    this.api.post('users', payload).subscribe({
      next: () => {
        this.toast.success('Teacher added successfully');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { name: '', email: '', phone: '', password: 'Teacher@1234', role: 'teacher' };
        this.touched = {};
        this.teachingSubjectSelections = [];
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
    this.editTeachingSubjectSelections = [...(t.teaching_subjects ?? [])];
    this.editTarget.set(t);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = {
      name: this.editForm.name, phone: this.editForm.phone,
      teaching_subjects: this.editTeachingSubjectSelections,
    };
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
