import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './questions.html',
  styleUrl: './questions.scss',
})
export class QuestionsPage implements OnInit {
  private api = inject(ApiService);

  questions = signal<any[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal('');

  form = {
    subject: '', topic: '', question_text: '', type: 'mcq',
    options: ['', '', '', ''], correct_answer: '', difficulty: 'medium', tags: ''
  };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.get<any[]>('questions').subscribe({
      next: (data) => { this.questions.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSubmit() {
    if (!this.form.subject || !this.form.question_text || !this.form.correct_answer) {
      this.error.set('Subject, question text and correct answer are required');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const payload: any = { ...this.form, tags: this.form.tags ? this.form.tags.split(',').map((t: string) => t.trim()) : [] };
    if (this.form.type !== 'mcq') payload.options = undefined;
    else payload.options = this.form.options.filter((o: string) => o.trim());

    this.api.post('questions', payload).subscribe({
      next: () => {
        this.success.set('Question added!');
        this.saving.set(false);
        this.showForm.set(false);
        this.form = { subject: '', topic: '', question_text: '', type: 'mcq', options: ['','','',''], correct_answer: '', difficulty: 'medium', tags: '' };
        this.load();
        setTimeout(() => this.success.set(''), 3000);
      },
      error: (err) => { this.error.set(err.error?.message || 'Failed'); this.saving.set(false); },
    });
  }

  diffBadge(d: string) {
    return { easy: 'badge-green', medium: 'badge-yellow', hard: 'badge-red' }[d] ?? 'badge-gray';
  }
}
