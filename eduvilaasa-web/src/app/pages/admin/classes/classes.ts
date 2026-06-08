import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './classes.html',
  styleUrl: './classes.scss',
})
export class ClassesPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  classes = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal('');
  expandedClass = signal<string | null>(null);
  addingSubjectFor = signal<string | null>(null);
  subjectForm = { name: '', code: '' };

  form = { name: '', section: '', academic_year: '' };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any[]>('classes').subscribe({
      next: (data) => { this.classes.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSubmit() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);
    this.api.post('classes', this.form).subscribe({
      next: () => {
        this.success.set('Class created');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { name: '', section: '', academic_year: '' };
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.message || 'Failed'); this.saving.set(false); setTimeout(() => this.error.set(''), 4000); },
    });
  }

  addSubject(classId: string) {
    const raw = this.subjectForm.name.trim();
    if (!raw) return;
    const titleCase = raw.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    this.api.post(`classes/${classId}/subjects`, { ...this.subjectForm, name: titleCase }).subscribe({
      next: () => { this.subjectForm = { name: '', code: '' }; this.addingSubjectFor.set(null); this.load(); },
      error: (err) => this.error.set(err.error?.message || 'Failed to add subject'),
    });
  }

  deleteSubject(classId: string, subjectId: string, subjectName: string) {
    if (!confirm(`Remove subject "${subjectName}"?`)) return;
    this.api.delete(`classes/${classId}/subjects/${subjectId}`).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message || 'Failed to remove subject'),
    });
  }

  toggle(id: string) { this.expandedClass.update((v) => (v === id ? null : id)); }

  editTarget = signal<any | null>(null);
  editForm   = { name: '', section: '', academic_year: '' };
  editSaving = signal(false);

  openEdit(cls: any) {
    this.editForm = { name: cls.name, section: cls.section ?? '', academic_year: cls.academic_year ?? '' };
    this.editTarget.set(cls);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) return;
    this.editSaving.set(true);
    this.api.patch(`classes/${this.editTarget()!.id}`, this.editForm).subscribe({
      next: () => { this.editTarget.set(null); this.editSaving.set(false); this.load(); },
      error: (err) => { this.error.set(err.error?.message || 'Failed to update'); this.editSaving.set(false); setTimeout(() => this.error.set(''), 4000); },
    });
  }

  deleteClass(cls: any) {
    if (!confirm(`Delete class "${cls.name}${cls.section ? ' — ' + cls.section : ''}"? This will also remove all its subjects.`)) return;
    this.api.delete(`classes/${cls.id}`).subscribe({
      next: () => { this.success.set('Class deleted'); this.load(); setTimeout(() => this.success.set(''), 3000); },
      error: (err) => { this.error.set(err.error?.message || 'Failed to delete class'); setTimeout(() => this.error.set(''), 4000); },
    });
  }
}
