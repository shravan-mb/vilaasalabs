import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton';
import { environment } from '../../../../environments/environment';

const API = environment.apiUrl;

@Component({
  selector: 'app-teacher-content-library',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <div class="page-header">
      <div><h1>Content Library</h1><p>Board-aligned syllabus, notes and question banks</p></div>
    </div>

    @if (boardsLoading()) {
      <div class="card"><app-skeleton [lines]="4"/></div>
    } @else if (!boards().length) {
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <p>No content packs enabled for your institution yet.</p>
          <p class="muted">Contact your platform administrator to enable board-specific content.</p>
        </div>
      </div>
    } @else {

      <!-- Board + filter selectors -->
      <div class="filters-row">
        <div class="filter-group">
          <label>Board</label>
          <select (change)="onBoardChange($any($event.target).value)">
            <option value="">— Select board —</option>
            @for (b of boards(); track b.id) {
              <option [value]="b.id">{{ b.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Standard</label>
          <select (change)="onStandardChange(+$any($event.target).value)" [disabled]="!selBoardId()">
            <option [value]="0">— All standards —</option>
            @for (s of standards; track s) {
              <option [value]="s">Standard {{ s }}</option>
            }
          </select>
        </div>
        @if (packs().length) {
          <div class="filter-group">
            <label>Subject</label>
            <select (change)="onPackChange($any($event.target).value)">
              <option value="">— Select subject —</option>
              @for (p of packs(); track p.id) {
                <option [value]="p.id">{{ p.subject }}</option>
              }
            </select>
          </div>
        }
      </div>

      <!-- Content tabs (once a pack is selected) -->
      @if (activePack()) {
        <div class="pack-banner">
          <div>
            <h3>{{ activePack()!.subject }} — Standard {{ activePack()!.standard }}</h3>
            <span class="muted">{{ activePack()!.board?.name }}</span>
          </div>
        </div>

        <div class="content-tabs">
          <button [class.active]="contentTab() === 'syllabus'"   (click)="switchTab('syllabus')">Syllabus & Notes</button>
          <button [class.active]="contentTab() === 'questions'"  (click)="switchTab('questions')">Question Bank ({{ questions().length }})</button>
          <button [class.active]="contentTab() === 'tests'"      (click)="switchTab('tests')">Test Templates ({{ tests().length }})</button>
        </div>

        <!-- ── SYLLABUS ──────────────────────────────────────────────── -->
        @if (contentTab() === 'syllabus') {
          @if (chaptersLoading()) { <div class="card"><app-skeleton [lines]="5"/></div> }
          @else if (!chapters().length) { <div class="card"><div class="empty-state">No syllabus chapters yet for this pack.</div></div> }
          @else {
            @for (ch of chapters(); track ch.id) {
              <div class="chapter-card">
                <div class="chapter-header" (click)="toggleChapter(ch.id)">
                  <div class="ch-badge">Ch {{ ch.chapter_number }}</div>
                  <div class="ch-title">{{ ch.chapter_name }}</div>
                  @if (ch.notes?.length) { <div class="ch-note-count">{{ ch.notes.length }} note(s)</div> }
                  <div class="ch-arrow">{{ expandedChapter() === ch.id ? '▲' : '▼' }}</div>
                </div>

                @if (expandedChapter() === ch.id) {
                  <div class="chapter-body">
                    @if (ch.topics?.length) {
                      <div class="ch-section">
                        <h5>Topics</h5>
                        <ul class="topics-list">
                          @for (t of ch.topics; track $index) { <li>{{ t }}</li> }
                        </ul>
                      </div>
                    }
                    @if (ch.learning_outcomes?.length) {
                      <div class="ch-section">
                        <h5>Learning Outcomes</h5>
                        <ul class="topics-list outcomes">
                          @for (o of ch.learning_outcomes; track $index) { <li>{{ o }}</li> }
                        </ul>
                      </div>
                    }
                    @if (ch.notes?.length) {
                      <div class="ch-section">
                        <h5>Notes</h5>
                        <div class="notes-grid">
                          @for (note of ch.notes; track note.id) {
                            <div class="note-card" [class.note-expanded]="expandedNote() === note.id">
                              <div class="note-header" (click)="toggleNote(note.id)">
                                <span class="note-title">{{ note.title }}</span>
                                <span class="note-arrow">{{ expandedNote() === note.id ? '▲' : '▼' }}</span>
                              </div>
                              @if (expandedNote() === note.id) {
                                <div class="note-body">{{ note.content }}</div>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        }

        <!-- ── QUESTIONS ─────────────────────────────────────────────── -->
        @if (contentTab() === 'questions') {
          @if (questionsLoading()) { <div class="card"><app-skeleton [lines]="5"/></div> }
          @else if (!questions().length) { <div class="card"><div class="empty-state">No questions in this pack yet.</div></div> }
          @else {
            <div class="q-filters">
              <span class="q-total">{{ questions().length }} questions</span>
              <select (change)="filterDifficulty = $any($event.target).value; filterQuestions()">
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            @for (q of filteredQuestions(); track q.id) {
              <div class="q-card">
                <div class="q-row-top">
                  <div class="q-text">{{ q.question_text }}</div>
                  <div class="q-tags">
                    <span class="tag" [class.easy]="q.difficulty==='easy'" [class.hard]="q.difficulty==='hard'">{{ q.difficulty }}</span>
                    <span class="tag">{{ q.marks }} mk</span>
                    @if (q.chapter) { <span class="tag tag-chapter">{{ q.chapter }}</span> }
                  </div>
                </div>
                @if (q.options?.length) {
                  <div class="q-options">
                    @for (opt of q.options; track $index; let i = $index) {
                      <div class="q-opt" [class.correct]="opt === q.correct_answer">
                        <span class="opt-letter">{{ 'ABCD'[i] }}</span> {{ opt }}
                        @if (opt === q.correct_answer) { <span class="correct-mark">✓</span> }
                      </div>
                    }
                  </div>
                }
                @if (q.explanation) {
                  <div class="q-explain"><strong>Explanation:</strong> {{ q.explanation }}</div>
                }
              </div>
            }
          }
        }

        <!-- ── TEST TEMPLATES ────────────────────────────────────────── -->
        @if (contentTab() === 'tests') {
          @if (testsLoading()) { <div class="card"><app-skeleton [lines]="4"/></div> }
          @else if (!tests().length) { <div class="card"><div class="empty-state">No test templates in this pack yet.</div></div> }
          @else {
            <div class="tests-grid">
              @for (t of tests(); track t.id) {
                <div class="test-card">
                  <div class="test-title">{{ t.title }}</div>
                  @if (t.description) { <div class="test-desc">{{ t.description }}</div> }
                  <div class="test-stats">
                    <div class="t-stat"><span class="t-val">{{ t.total_questions }}</span><span class="t-lbl">Questions</span></div>
                    <div class="t-stat"><span class="t-val">{{ t.total_marks }}</span><span class="t-lbl">Marks</span></div>
                    <div class="t-stat"><span class="t-val">{{ t.duration_minutes }}</span><span class="t-lbl">Minutes</span></div>
                  </div>
                </div>
              }
            </div>
          }
        }
      }
    }
  `,
  styles: [`
    .filters-row { display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px; }
    .filter-group { display:flex;flex-direction:column;gap:5px;min-width:160px; }
    .filter-group label { font-size:11px;font-weight:700;color:var(--ev-muted);text-transform:uppercase;letter-spacing:.05em; }
    .filter-group select { padding:8px 10px;border-radius:8px;border:1px solid var(--ev-border);background:var(--ev-card-2);color:var(--ev-text);font-size:13px;min-width:160px; }

    .pack-banner { padding:14px 18px;background:linear-gradient(135deg,#1a0a2e,#0f1a2e);border:1px solid #2d1460;border-radius:12px;margin-bottom:16px;
      h3{margin:0 0 4px;color:#e2e8f0;font-size:16px;} .muted{font-size:12px;color:#a78bfa;} }

    .content-tabs { display:flex;gap:4px;margin-bottom:16px;
      button{padding:7px 16px;border-radius:7px;border:1px solid var(--ev-border);background:var(--ev-card-2);color:var(--ev-muted);font-size:13px;font-weight:600;cursor:pointer;
        &.active{background:#7c3aed;color:#fff;border-color:#7c3aed;}
        &:hover:not(.active){border-color:#7c3aed;color:var(--ev-text);}
      }
    }

    .chapter-card { background:var(--ev-card);border:1px solid var(--ev-border);border-radius:10px;margin-bottom:10px;overflow:hidden; }
    .chapter-header { display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;
      &:hover{background:var(--ev-card-2);}
    }
    .ch-badge { font-size:11px;font-weight:700;color:#a78bfa;background:rgba(124,58,237,.15);padding:3px 8px;border-radius:5px;white-space:nowrap; }
    .ch-title { flex:1;font-weight:600;font-size:14px;color:var(--ev-text); }
    .ch-note-count { font-size:11px;color:var(--ev-muted); }
    .ch-arrow { font-size:11px;color:var(--ev-dim); }

    .chapter-body { padding:0 16px 16px;border-top:1px solid var(--ev-border); }
    .ch-section { margin-top:12px; h5{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--ev-muted);margin:0 0 8px;} }
    .topics-list { margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px;
      li{font-size:13px;color:var(--ev-text-2);}
      &.outcomes li{color:#4ade80;}
    }

    .notes-grid { display:flex;flex-direction:column;gap:8px; }
    .note-card { background:var(--ev-card-2);border:1px solid var(--ev-border);border-radius:8px;overflow:hidden; }
    .note-header { display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;
      &:hover{background:rgba(255,255,255,.04);}
    }
    .note-title { font-weight:600;font-size:13px;color:var(--ev-text); }
    .note-arrow { font-size:11px;color:var(--ev-dim); }
    .note-body { padding:12px 14px;font-size:13px;color:var(--ev-text-2);line-height:1.7;white-space:pre-wrap;border-top:1px solid var(--ev-border); }

    .q-filters { display:flex;align-items:center;gap:12px;margin-bottom:12px;
      select{padding:6px 10px;border-radius:6px;border:1px solid var(--ev-border);background:var(--ev-card-2);color:var(--ev-text);font-size:12px;}
    }
    .q-total { font-size:12px;color:var(--ev-muted);font-weight:600; }
    .q-card { background:var(--ev-card);border:1px solid var(--ev-border);border-radius:10px;padding:16px;margin-bottom:10px; }
    .q-row-top { display:flex;align-items:flex-start;gap:12px;margin-bottom:10px; }
    .q-text { flex:1;font-size:14px;color:var(--ev-text);line-height:1.6;font-weight:500; }
    .q-tags { display:flex;flex-direction:column;gap:4px;align-items:flex-end;flex-shrink:0; }
    .tag { font-size:11px;font-weight:700;padding:2px 8px;border-radius:4px;background:rgba(124,58,237,.12);color:#a78bfa;
      &.easy{background:rgba(34,197,94,.12);color:#4ade80;}
      &.hard{background:rgba(248,113,113,.12);color:#f87171;}
      &.tag-chapter{background:rgba(251,191,36,.12);color:#fbbf24;}
    }
    .q-options { display:flex;flex-direction:column;gap:6px; }
    .q-opt { display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ev-text-2);padding:7px 10px;border-radius:6px;border:1px solid var(--ev-border);background:var(--ev-card-2);
      &.correct{border-color:#22c55e;background:rgba(34,197,94,.08);color:#4ade80;}
    }
    .opt-letter { font-size:11px;font-weight:800;color:var(--ev-muted);width:16px;flex-shrink:0; }
    .correct-mark { margin-left:auto;color:#22c55e;font-weight:800; }
    .q-explain { margin-top:10px;padding:8px 12px;background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.2);border-radius:6px;font-size:12px;color:#fbbf24;line-height:1.5; }

    .tests-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px; }
    .test-card { background:var(--ev-card);border:1px solid var(--ev-border);border-radius:12px;padding:18px; }
    .test-title { font-weight:700;font-size:15px;color:var(--ev-text);margin-bottom:6px; }
    .test-desc { font-size:13px;color:var(--ev-muted);line-height:1.5;margin-bottom:12px; }
    .test-stats { display:flex;gap:16px; }
    .t-stat { display:flex;flex-direction:column;align-items:center; }
    .t-val { font-size:22px;font-weight:700;color:#a78bfa; }
    .t-lbl { font-size:11px;color:var(--ev-muted);text-transform:uppercase;letter-spacing:.05em; }

    .empty-state { text-align:center;padding:40px;color:var(--ev-muted);
      .empty-icon{font-size:36px;margin-bottom:12px;}
      p{font-size:14px;margin:0 0 6px;}
      p.muted{font-size:12px;color:var(--ev-dim);}
    }
    .muted{color:var(--ev-muted);}
  `],
})
export class TeacherContentLibraryPage implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  standards = [1,2,3,4,5,6,7,8,9,10,11,12];

  boardsLoading = signal(true);
  boards   = signal<any[]>([]);
  selBoardId = signal('');
  selStandard = signal(0);
  packs    = signal<any[]>([]);
  activePack = signal<any>(null);
  contentTab = signal<'syllabus' | 'questions' | 'tests'>('syllabus');

  chaptersLoading  = signal(false);
  questionsLoading = signal(false);
  testsLoading     = signal(false);

  chapters  = signal<any[]>([]);
  questions = signal<any[]>([]);
  tests     = signal<any[]>([]);

  filteredQs = signal<any[]>([]);
  filterDifficulty = '';

  expandedChapter = signal<string | null>(null);
  expandedNote    = signal<string | null>(null);

  ngOnInit() {
    this.http.get<any[]>(`${API}/content/boards`).subscribe({
      next: (b) => { this.boards.set(b); this.boardsLoading.set(false); },
      error: () => { this.toast.error('Failed to load content boards'); this.boardsLoading.set(false); },
    });
  }

  onBoardChange(boardId: string) {
    this.selBoardId.set(boardId);
    this.packs.set([]); this.activePack.set(null);
    this.selStandard.set(0);
    if (boardId) this.loadPacks(boardId, 0);
  }

  onStandardChange(std: number) {
    this.selStandard.set(std);
    this.packs.set([]); this.activePack.set(null);
    const b = this.selBoardId(); if (!b) return;
    this.loadPacks(b, std);
  }

  loadPacks(boardId: string, standard: number) {
    const p = new URLSearchParams({ boardId });
    if (standard) p.set('standard', String(standard));
    this.http.get<any[]>(`${API}/content/packs?${p}`).subscribe({
      next: (packs) => this.packs.set(packs),
      error: () => this.toast.error('Failed to load packs'),
    });
  }

  onPackChange(packId: string) {
    const pack = this.packs().find((p) => p.id === packId);
    this.activePack.set(pack ?? null);
    if (!pack) return;
    this.contentTab.set('syllabus');
    this.loadChapters(); this.loadQuestions(); this.loadTests();
  }

  switchTab(tab: 'syllabus' | 'questions' | 'tests') {
    this.contentTab.set(tab);
  }

  loadChapters() {
    const p = this.activePack(); if (!p) return;
    this.chaptersLoading.set(true);
    this.http.get<any[]>(`${API}/content/packs/${p.id}/chapters`).subscribe({
      next: (c) => { this.chapters.set(c); this.chaptersLoading.set(false); },
      error: () => this.chaptersLoading.set(false),
    });
  }

  loadQuestions() {
    const p = this.activePack(); if (!p) return;
    this.questionsLoading.set(true);
    this.http.get<any[]>(`${API}/content/packs/${p.id}/questions`).subscribe({
      next: (q) => {
        this.questions.set(q);
        this.filteredQs.set(q);
        this.questionsLoading.set(false);
      },
      error: () => this.questionsLoading.set(false),
    });
  }

  loadTests() {
    const p = this.activePack(); if (!p) return;
    this.testsLoading.set(true);
    this.http.get<any[]>(`${API}/content/packs/${p.id}/tests`).subscribe({
      next: (t) => { this.tests.set(t); this.testsLoading.set(false); },
      error: () => this.testsLoading.set(false),
    });
  }

  filteredQuestions() {
    if (!this.filterDifficulty) return this.questions();
    return this.questions().filter((q) => q.difficulty === this.filterDifficulty);
  }

  filterQuestions() {
    this.filteredQs.set(this.filteredQuestions());
  }

  toggleChapter(id: string) {
    this.expandedChapter.update((cur) => (cur === id ? null : id));
  }

  toggleNote(id: string) {
    this.expandedNote.update((cur) => (cur === id ? null : id));
  }
}
