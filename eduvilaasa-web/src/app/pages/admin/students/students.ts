import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  students = signal<any[]>([]);
  classes = signal<any[]>([]);
  teachers = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');

  form = { name: '', email: '', phone: '', password: '', role: 'student', class_id: '', proctor_id: '' };
  touched: Record<string, boolean> = {};

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '', class_id: '', proctor_id: '' };
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  ngOnInit() { this.loadStudents(); this.loadClasses(); this.loadTeachers(); }

  loadStudents() {
    this.loading.set(true);
    this.api.get<any>('users', { role: 'student', limit: '200' }).subscribe({
      next: (res: any) => { this.students.set(res.data ?? res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadClasses() {
    this.api.get<any[]>('classes').subscribe({ next: (data) => this.classes.set(data) });
  }

  loadTeachers() {
    this.api.get<any>('users', { role: 'teacher', limit: '200' }).subscribe({
      next: (res: any) => this.teachers.set(res.data ?? res),
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
    const payload: any = { name: this.form.name, phone: this.form.phone, password: this.form.password, role: 'student' };
    if (this.form.email) payload.email = this.form.email;
    if (this.form.class_id) payload.class_id = this.form.class_id;
    if (this.form.proctor_id) payload.proctor_id = this.form.proctor_id;
    this.api.post('users', payload).subscribe({
      next: () => {
        this.toast.success('Student added successfully');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { name: '', email: '', phone: '', password: '', role: 'student', class_id: '', proctor_id: '' };
        this.touched = {};
        this.loadStudents();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to add student');
        this.saving.set(false);
        setTimeout(() => this.error.set(''), 4000);
      },
    });
  }

  openEdit(s: any) {
    this.editForm = {
      name: s.name, email: s.email ?? '', phone: s.phone ?? '',
      class_id: s.class_id ?? '', proctor_id: s.proctor_id ?? '',
    };
    this.editTarget.set(s);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = { name: this.editForm.name, phone: this.editForm.phone };
    if (this.editForm.email) payload.email = this.editForm.email;
    if (this.editForm.class_id) payload.class_id = this.editForm.class_id;
    payload.proctor_id = this.editForm.proctor_id || null;
    this.api.patch(`users/${this.editTarget().id}`, payload).subscribe({
      next: () => {
        this.toast.success('Student updated');
        this.editTarget.set(null);
        this.editSaving.set(false);
        this.loadStudents();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update');
        this.editSaving.set(false);
      },
    });
  }

  openResetPassword(s: any) { this.newPassword = ''; this.passwordTarget.set(s); }

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
    this.api.patch(`users/${id}/deactivate`, {}).subscribe({ next: () => this.loadStudents() });
  }

  activate(id: string) {
    this.api.patch(`users/${id}/activate`, {}).subscribe({ next: () => this.loadStudents() });
  }

  delete(id: string) {
    if (!confirm('Delete this student permanently?')) return;
    this.api.delete(`users/${id}`).subscribe({
      next: () => { this.toast.success('Student deleted'); this.loadStudents(); },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete'),
    });
  }

  className(classId: string): string {
    const cls = this.classes().find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ' — ' + cls.section : ''}` : '—';
  }

  teacherName(teacherId: string | null): string {
    if (!teacherId) return '—';
    const t = this.teachers().find((t) => t.id === teacherId);
    return t ? t.name : '—';
  }

  // Class-wise grouping
  expandedClasses = signal<Set<string>>(new Set());

  studentsByClass = computed(() => {
    const map = new Map<string | null, any[]>();
    for (const s of this.students()) {
      const key = s.class_id || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  });

  studentsForClass(classId: string | null): any[] {
    return this.studentsByClass().get(classId) ?? [];
  }

  isExpanded(classId: string): boolean {
    return this.expandedClasses().has(classId);
  }

  toggleClass(classId: string) {
    this.expandedClasses.update(prev => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId); else next.add(classId);
      return next;
    });
  }

  // Bulk proctor assignment
  bulkProctorClassId = '';
  bulkProctorTeacherId = '';
  showBulkProctor = signal(false);
  bulkAssigning = signal(false);

  openBulkProctor() {
    this.bulkProctorClassId = '';
    this.bulkProctorTeacherId = '';
    this.showBulkProctor.set(true);
  }

  saveBulkProctor() {
    if (!this.bulkProctorClassId || !this.bulkProctorTeacherId) {
      this.toast.error('Select a class and a teacher');
      return;
    }
    this.bulkAssigning.set(true);
    this.api.patch('users/bulk-proctor', { class_id: this.bulkProctorClassId, proctor_id: this.bulkProctorTeacherId }).subscribe({
      next: (res: any) => {
        this.toast.success(`Proctor assigned to ${res.updated} students`);
        this.showBulkProctor.set(false);
        this.bulkAssigning.set(false);
        this.loadStudents();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to assign proctor');
        this.bulkAssigning.set(false);
      },
    });
  }
}
