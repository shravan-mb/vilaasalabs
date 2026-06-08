import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-teacher-tests',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './tests.html',
  styleUrl: './tests.scss',
})
export class TeacherTestsPage implements OnInit {
  private api = inject(ApiService);

  tests = signal<any[]>([]);
  questions = signal<any[]>([]);
  classes = signal<any[]>([]);
  classSubjects = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal('');

  form = { title: '', subject: '', class_id: '', total_marks: 0, duration_minutes: 0, question_ids: [] as string[] };

  ngOnInit() {
    this.load();
    this.api.get<any[]>('questions').subscribe((data) => this.questions.set(data ?? []));
    this.api.get<any[]>('classes').subscribe((data) => this.classes.set(data ?? []));
  }

  load() {
    this.loading.set(true);
    this.api.get<any[]>('tests').subscribe({
      next: (data) => { this.tests.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onClassChange() {
    this.form.subject = '';
    this.classSubjects.set([]);
    if (!this.form.class_id) return;
    this.api.get<any[]>(`classes/${this.form.class_id}/subjects`).subscribe({
      next: (data) => this.classSubjects.set(data ?? []),
    });
  }

  get filteredQuestions(): any[] {
    const qs = this.questions();
    if (!this.form.subject) return qs;
    return qs.filter((q) => q.subject?.toLowerCase() === this.form.subject.toLowerCase());
  }

  toggleQuestion(id: string) {
    const current = this.form.question_ids;
    if (current.includes(id)) {
      this.form.question_ids = current.filter((q) => q !== id);
    } else {
      this.form.question_ids = [...current, id];
    }
  }

  isSelected(id: string) { return this.form.question_ids.includes(id); }

  onSubmit() {
    if (!this.form.title || !this.form.question_ids.length || !this.form.total_marks) {
      this.error.set('Title, at least one question and total marks are required');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const payload: any = { ...this.form };
    if (!payload.class_id) delete payload.class_id;
    this.api.post('tests', payload).subscribe({
      next: () => {
        this.success.set('Test created successfully!');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { title: '', subject: '', class_id: '', total_marks: 0, duration_minutes: 0, question_ids: [] };
        this.classSubjects.set([]);
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.message || 'Failed'); this.saving.set(false); },
    });
  }

  statusClass(s: string) {
    return { draft: 'badge-gray', published: 'badge-green', closed: 'badge-red' }[s] ?? 'badge-gray';
  }

  className(classId: string): string {
    const cls = this.classes().find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ' — ' + cls.section : ''}` : classId;
  }

  changeStatus(id: string, status: string) {
    this.api.patch(`tests/${id}/status`, { status }).subscribe({
      next: () => this.tests.update((arr) => arr.map((t) => t.id === id ? { ...t, status } : t)),
      error: (err) => this.error.set(err.error?.message || 'Failed to update status'),
    });
  }
}
