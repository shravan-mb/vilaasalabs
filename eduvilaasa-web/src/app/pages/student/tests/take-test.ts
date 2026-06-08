import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Question {
  id: string;
  question_text: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  options: string[] | null;
  subject: string;
  difficulty: string;
}

interface TestData {
  test: {
    id: string;
    title: string;
    subject: string;
    total_marks: number;
    duration_minutes: number;
    description: string;
  };
  questions: Question[];
  already_submitted: boolean;
}

interface SubmitResult {
  score: number;
  total_marks: number;
  correct: number;
  total_questions: number;
  short_answer_count: number;
}

@Component({
  selector: 'app-take-test',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './take-test.html',
  styleUrl: './take-test.scss',
})
export class TakeTestPage implements OnInit, OnDestroy {
  private api    = inject(ApiService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  testId = '';

  loading   = signal(true);
  error     = signal('');
  testData  = signal<TestData | null>(null);
  answers   = signal<Record<string, string>>({});
  submitted = signal(false);
  result    = signal<SubmitResult | null>(null);
  submitting = signal(false);

  // Timer
  timeLeft   = signal(0);
  timerLabel = signal('');
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.testId = this.route.snapshot.paramMap.get('testId') ?? '';
    this.api.get<TestData>(`my-tests/${this.testId}`).subscribe({
      next: (data) => {
        this.testData.set(data);
        this.loading.set(false);
        if (data.already_submitted) return;
        if (data.test.duration_minutes) {
          this.timeLeft.set(data.test.duration_minutes * 60);
          this.startTimer();
        }
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Failed to load test');
        this.loading.set(false);
      },
    });
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private startTimer() {
    this.updateTimerLabel();
    this.timerInterval = setInterval(() => {
      const t = this.timeLeft() - 1;
      if (t <= 0) {
        this.timeLeft.set(0);
        this.updateTimerLabel();
        this.clearTimer();
        this.submitAnswers(true);
      } else {
        this.timeLeft.set(t);
        this.updateTimerLabel();
      }
    }, 1000);
  }

  private clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private updateTimerLabel() {
    const t = this.timeLeft();
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = (t % 60).toString().padStart(2, '0');
    this.timerLabel.set(`${m}:${s}`);
  }

  setAnswer(questionId: string, value: string) {
    this.answers.update(a => ({ ...a, [questionId]: value }));
  }

  getAnswer(questionId: string): string {
    return this.answers()[questionId] ?? '';
  }

  get answeredCount(): number {
    return Object.values(this.answers()).filter(v => v.trim() !== '').length;
  }

  get totalQuestions(): number {
    return this.testData()?.questions.length ?? 0;
  }

  get timerWarning(): boolean {
    return this.timeLeft() > 0 && this.timeLeft() <= 60;
  }

  submitAnswers(autoSubmit = false) {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.clearTimer();

    this.api.post<SubmitResult>(`my-tests/${this.testId}/submit`, { answers: this.answers() }).subscribe({
      next: (res) => {
        this.result.set(res);
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Submission failed');
        this.submitting.set(false);
      },
    });
  }

  goBack() {
    this.router.navigate(['/student/tests']);
  }

  get scorePercent(): number {
    const r = this.result();
    if (!r || r.total_marks === 0) return 0;
    return Math.round((r.score / r.total_marks) * 100);
  }

  get scoreGrade(): string {
    const p = this.scorePercent;
    if (p >= 90) return 'A+';
    if (p >= 80) return 'A';
    if (p >= 70) return 'B';
    if (p >= 60) return 'C';
    if (p >= 50) return 'D';
    return 'F';
  }
}
