import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';

const STANDARDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const PREDEFINED_BOARDS = [
  { name: 'Karnataka State Board (KSEEB)',   code: 'karnataka_state', description: 'Karnataka Secondary Education Examination Board — Kannada / English medium' },
  { name: 'CBSE',                            code: 'cbse',            description: 'Central Board of Secondary Education — National curriculum' },
  { name: 'ICSE / ISC',                      code: 'icse',            description: 'Indian Certificate of Secondary Education (CISCE)' },
  { name: 'IGCSE (Cambridge)',               code: 'igcse',           description: 'Cambridge International General Certificate of Secondary Education' },
  { name: 'IB (International Baccalaureate)',code: 'ib',              description: 'International Baccalaureate Diploma Programme' },
];
const SUBJECTS_BY_STANDARD: Record<number, string[]> = {
  1:  ['Mathematics', 'English', 'Kannada', 'Environmental Science'],
  2:  ['Mathematics', 'English', 'Kannada', 'Environmental Science'],
  3:  ['Mathematics', 'English', 'Kannada', 'Environmental Science'],
  4:  ['Mathematics', 'English', 'Kannada', 'Environmental Science'],
  5:  ['Mathematics', 'English', 'Kannada', 'Environmental Science'],
  6:  ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Kannada'],
  7:  ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Kannada'],
  8:  ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Kannada', 'Computer Science'],
  9:  ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Kannada', 'Computer Science'],
  10: ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi', 'Kannada', 'Computer Science'],
  11: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'],
  12: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English'],
};

@Component({
  selector: 'app-content-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-library.html',
  styleUrl: './content-library.scss',
})
export class ContentLibrary implements OnInit {
  mainTab = signal<'boards' | 'content'>('boards');

  // ── Boards tab ─────────────────────────────────────────────────────────────
  boards = signal<any[]>([]);
  boardsLoading = signal(true);
  boardForm = { name: '', code: '', description: '' };
  savingBoard = signal(false);
  boardMsg = signal('');
  predefinedBoards = PREDEFINED_BOARDS;

  // ── Content tab ────────────────────────────────────────────────────────────
  selBoardId  = signal('');
  selStandard = signal(0);
  selSubject  = signal('');
  packs = signal<any[]>([]);
  packsLoading = signal(false);
  activePack  = signal<any>(null);
  contentTab  = signal<'syllabus' | 'questions' | 'tests'>('syllabus');

  // Syllabus
  chapters = signal<any[]>([]);
  chapterForm = { chapter_number: 1, chapter_name: '', topics: '', learning_outcomes: '' };
  savingChapter = signal(false);
  expandedChapter = signal<string | null>(null);
  noteForm: Record<string, { title: string; content: string }> = {};
  savingNote = signal(false);

  // Questions
  questions = signal<any[]>([]);
  qForm = { question_text: '', options: ['', '', '', ''], correct_answer: '', difficulty: 'medium', marks: 1, chapter: '', explanation: '' };
  savingQ = signal(false);
  showQForm = signal(false);

  // Tests
  tests = signal<any[]>([]);
  testForm = { title: '', description: '', total_questions: 10, total_marks: 10, duration_minutes: 30 };
  savingTest = signal(false);
  showTestForm = signal(false);

  standards = STANDARDS;
  subjects: string[] = [];

  msg    = signal('');
  errMsg = signal('');

  constructor(private api: AdminApiService) {}

  ngOnInit() { this.loadBoards(); }

  // ── Board management ──────────────────────────────────────────────────────

  onBoardPresetChange(name: string) {
    const preset = PREDEFINED_BOARDS.find((b) => b.name === name);
    if (preset) {
      this.boardForm.name = preset.name;
      this.boardForm.code = preset.code;
      this.boardForm.description = preset.description;
    } else {
      this.boardForm.name = name;
      this.boardForm.code = '';
      this.boardForm.description = '';
    }
  }

  loadBoards() {
    this.boardsLoading.set(true);
    this.api.listBoards().subscribe({
      next: (b) => { this.boards.set(b); this.boardsLoading.set(false); },
      error: () => this.boardsLoading.set(false),
    });
  }

  saveBoard() {
    if (!this.boardForm.name || !this.boardForm.code) return;
    this.savingBoard.set(true);
    this.api.createBoard({ ...this.boardForm, code: this.boardForm.code.toLowerCase().replace(/\s+/g, '_') }).subscribe({
      next: () => {
        this.boardMsg.set('Board created');
        this.boardForm = { name: '', code: '', description: '' };
        this.savingBoard.set(false);
        this.loadBoards();
        setTimeout(() => this.boardMsg.set(''), 3000);
      },
      error: () => { this.boardMsg.set('Failed to create board'); this.savingBoard.set(false); },
    });
  }

  toggleBoardActive(board: any) {
    this.api.updateBoard(board.id, { is_active: !board.is_active }).subscribe({ next: () => this.loadBoards() });
  }

  // ── Content selector ──────────────────────────────────────────────────────

  onStandardChange() {
    const s = this.selStandard();
    this.subjects = s ? (SUBJECTS_BY_STANDARD[s] ?? []) : [];
    this.selSubject.set('');
    this.activePack.set(null);
    this.loadPacks();
  }

  loadPacks() {
    const b = this.selBoardId();
    const s = this.selStandard();
    if (!b || !s) { this.packs.set([]); return; }
    this.packsLoading.set(true);
    this.api.listPacks(b, s).subscribe({
      next: (p) => { this.packs.set(p); this.packsLoading.set(false); },
      error: () => this.packsLoading.set(false),
    });
  }

  selectPack(pack: any) {
    this.activePack.set(pack);
    this.contentTab.set('syllabus');
    this.loadChapters();
    this.loadQuestions();
    this.loadTests();
  }

  createPack() {
    const b = this.selBoardId(); const s = this.selStandard(); const sub = this.selSubject();
    if (!b || !s || !sub) return;
    this.api.createPack({ board_id: b, standard: s, subject: sub }).subscribe({
      next: () => this.loadPacks(),
      error: () => this.flash('Failed to create pack', true),
    });
  }

  togglePackPublished(pack: any) {
    this.api.updatePack(pack.id, { is_published: !pack.is_published }).subscribe({ next: () => this.loadPacks() });
  }

  deletePack(packId: string) {
    if (!confirm('Delete this content pack? All chapters, questions and tests inside it will be deleted.')) return;
    this.api.deletePack(packId).subscribe({ next: () => { this.loadPacks(); if (this.activePack()?.id === packId) this.activePack.set(null); } });
  }

  // ── Chapters ──────────────────────────────────────────────────────────────

  loadChapters() {
    const p = this.activePack();
    if (!p) return;
    this.api.getPackChapters(p.id).subscribe({ next: (c) => this.chapters.set(c) });
  }

  saveChapter() {
    const p = this.activePack(); if (!p) return;
    this.savingChapter.set(true);
    const dto = {
      chapter_number: +this.chapterForm.chapter_number,
      chapter_name: this.chapterForm.chapter_name,
      topics: this.chapterForm.topics.split('\n').map((t) => t.trim()).filter(Boolean),
      learning_outcomes: this.chapterForm.learning_outcomes.split('\n').map((t) => t.trim()).filter(Boolean),
    };
    this.api.createChapter(p.id, dto).subscribe({
      next: () => {
        this.savingChapter.set(false);
        this.chapterForm = { chapter_number: dto.chapter_number + 1, chapter_name: '', topics: '', learning_outcomes: '' };
        this.loadChapters();
      },
      error: () => this.savingChapter.set(false),
    });
  }

  deleteChapter(id: string) {
    if (!confirm('Delete this chapter and all its notes?')) return;
    this.api.deleteChapter(id).subscribe({ next: () => this.loadChapters() });
  }

  toggleChapter(id: string) {
    this.expandedChapter.update((cur) => (cur === id ? null : id));
    if (!this.noteForm[id]) this.noteForm[id] = { title: '', content: '' };
  }

  saveNote(chapterId: string) {
    const f = this.noteForm[chapterId]; if (!f?.title || !f?.content) return;
    this.savingNote.set(true);
    this.api.createNote(chapterId, f).subscribe({
      next: () => { this.noteForm[chapterId] = { title: '', content: '' }; this.savingNote.set(false); this.loadChapters(); },
      error: () => this.savingNote.set(false),
    });
  }

  deleteNote(noteId: string) {
    this.api.deleteNote(noteId).subscribe({ next: () => this.loadChapters() });
  }

  // ── Questions ─────────────────────────────────────────────────────────────

  loadQuestions() {
    const p = this.activePack(); if (!p) return;
    this.api.getPackQuestions(p.id).subscribe({ next: (q) => this.questions.set(q) });
  }

  saveQuestion() {
    const p = this.activePack(); if (!p) return;
    this.savingQ.set(true);
    const dto = {
      question_text: this.qForm.question_text,
      question_type: 'mcq',
      options: this.qForm.options.filter(Boolean),
      correct_answer: this.qForm.correct_answer,
      difficulty: this.qForm.difficulty,
      marks: +this.qForm.marks,
      chapter: this.qForm.chapter || undefined,
      explanation: this.qForm.explanation || undefined,
    };
    this.api.createQuestion(p.id, dto).subscribe({
      next: () => {
        this.savingQ.set(false);
        this.qForm = { question_text: '', options: ['', '', '', ''], correct_answer: '', difficulty: 'medium', marks: 1, chapter: '', explanation: '' };
        this.showQForm.set(false);
        this.loadQuestions();
      },
      error: () => this.savingQ.set(false),
    });
  }

  deleteQuestion(id: string) {
    this.api.deleteQuestion(id).subscribe({ next: () => this.loadQuestions() });
  }

  // ── Tests ─────────────────────────────────────────────────────────────────

  loadTests() {
    const p = this.activePack(); if (!p) return;
    this.api.getPackTests(p.id).subscribe({ next: (t) => this.tests.set(t) });
  }

  saveTest() {
    const p = this.activePack(); if (!p) return;
    this.savingTest.set(true);
    this.api.createTestTemplate(p.id, { ...this.testForm, total_questions: +this.testForm.total_questions, total_marks: +this.testForm.total_marks, duration_minutes: +this.testForm.duration_minutes }).subscribe({
      next: () => {
        this.savingTest.set(false);
        this.testForm = { title: '', description: '', total_questions: 10, total_marks: 10, duration_minutes: 30 };
        this.showTestForm.set(false);
        this.loadTests();
      },
      error: () => this.savingTest.set(false),
    });
  }

  deleteTest(id: string) {
    this.api.deleteTestTemplate(id).subscribe({ next: () => this.loadTests() });
  }

  flash(text: string, isErr = false) {
    if (isErr) { this.errMsg.set(text); setTimeout(() => this.errMsg.set(''), 3000); }
    else        { this.msg.set(text);    setTimeout(() => this.msg.set(''), 3000); }
  }

  trackById(_: number, item: any) { return item.id; }
}
