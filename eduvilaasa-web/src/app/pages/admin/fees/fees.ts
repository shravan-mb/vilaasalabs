import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

type Tab = 'categories' | 'structure' | 'collect';

const FREQUENCIES = [
  { value: 'annual',   label: 'Annual'   },
  { value: 'term',     label: 'Per Term' },
  { value: 'monthly',  label: 'Monthly'  },
  { value: 'one_time', label: 'One-Time' },
];

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fees.html',
  styleUrl: './fees.scss',
})
export class FeesPage implements OnInit {
  activeTab = signal<Tab>('categories');
  frequencies = FREQUENCIES;

  // ── categories ────────────────────────────────────────────────────────────────
  categories  = signal<any[]>([]);
  catForm     = { name: '', description: '', frequency: 'annual' };
  editCat     = signal<any | null>(null);
  editCatForm = { name: '', description: '', frequency: 'annual' };
  catSaving   = signal(false);

  // ── structure ─────────────────────────────────────────────────────────────────
  classes      = signal<any[]>([]);
  selClassId   = '';   // plain string — NOT a signal (avoids [(ngModel)] signal-corruption bug)
  structures   = signal<any[]>([]);
  structureAmounts: Record<string, { amount: string; due_date: string }> = {};
  structSaving = signal<Record<string, boolean>>({});
  structLoading = signal(false);

  // ── copy structure ─────────────────────────────────────────────────────────────
  showCopyModal     = signal(false);
  copyTargetIds: string[] = [];
  overwriteExisting = false;
  copySaving        = signal(false);
  copyResult        = signal<{ copied: number; skipped: number } | null>(null);

  // ── collect payment ───────────────────────────────────────────────────────────
  allStudents    = signal<any[]>([]);
  studentSearch  = signal('');
  selStudent     = signal<any | null>(null);
  feeSummary     = signal<any | null>(null);
  summaryLoading = signal(false);
  payForm        = { fee_category_id: '', amount_paid: 0, payment_date: '', remarks: '' };
  paymentHistory = signal<any[]>([]);
  paySaving      = signal(false);
  lastReceipt    = signal('');

  // ── discount ──────────────────────────────────────────────────────────────────
  showDiscountModal = signal(false);
  discountForm = { fee_category_id: '', discount_amount: 0, reason: '' };
  discSaving   = signal(false);
  discounts    = signal<any[]>([]);

  filteredStudents = computed(() => {
    const q = this.studentSearch().toLowerCase();
    if (!q) return this.allStudents();
    return this.allStudents().filter(
      (s) => s.name.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q),
    );
  });

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.loadCategories();
    this.loadClasses();
    this.loadStudents();
    this.payForm.payment_date = new Date().toISOString().split('T')[0];
  }

  // ── categories ────────────────────────────────────────────────────────────────

  loadCategories() {
    this.api.get<any[]>('fees/categories').subscribe({ next: (c) => this.categories.set(c ?? []) });
  }

  addCategory() {
    if (!this.catForm.name.trim()) return;
    this.catSaving.set(true);
    this.api.post('fees/categories', this.catForm).subscribe({
      next: () => {
        this.catForm = { name: '', description: '', frequency: 'annual' };
        this.catSaving.set(false);
        this.loadCategories();
      },
      error: () => this.catSaving.set(false),
    });
  }

  openEditCat(cat: any) {
    this.editCat.set(cat);
    this.editCatForm = { name: cat.name, description: cat.description ?? '', frequency: cat.frequency };
  }

  saveEditCat() {
    const cat = this.editCat();
    if (!cat) return;
    this.catSaving.set(true);
    this.api.patch(`fees/categories/${cat.id}`, this.editCatForm).subscribe({
      next: () => { this.editCat.set(null); this.catSaving.set(false); this.loadCategories(); },
      error: () => this.catSaving.set(false),
    });
  }

  deleteCat(id: string) {
    if (!confirm('Delete this fee category? All related structures will be removed.')) return;
    this.api.delete(`fees/categories/${id}`).subscribe({ next: () => this.loadCategories() });
  }

  freqLabel(val: string) { return FREQUENCIES.find((f) => f.value === val)?.label ?? val; }

  // ── structure ─────────────────────────────────────────────────────────────────

  loadClasses() {
    this.api.get<any[]>('classes').subscribe({ next: (c) => this.classes.set(c ?? []) });
  }

  onClassSelect() {
    const cid = this.selClassId;   // plain string access — no signal call
    if (!cid) { this.structures.set([]); this.structureAmounts = {}; return; }
    this.structLoading.set(true);
    this.api.get<any[]>('fees/structures', { classId: cid }).subscribe({
      next: (list) => {
        this.structures.set(list ?? []);
        this.structureAmounts = {};
        for (const s of list ?? []) {
          this.structureAmounts[s.fee_category_id] = { amount: String(s.amount), due_date: s.due_date ?? '' };
        }
        // ensure every active category has an editable row
        for (const cat of this.categories()) {
          if (!this.structureAmounts[cat.id]) {
            this.structureAmounts[cat.id] = { amount: '', due_date: '' };
          }
        }
        this.structLoading.set(false);
      },
      error: () => this.structLoading.set(false),
    });
  }

  saveStructureRow(catId: string) {
    const entry = this.structureAmounts[catId];
    const amt   = Number(entry?.amount);
    if (!entry || entry.amount === '' || isNaN(amt) || amt < 0) return;
    this.structSaving.update((s) => ({ ...s, [catId]: true }));
    this.api.post('fees/structures', {
      class_id:        this.selClassId,
      fee_category_id: catId,
      amount:          amt,
      due_date:        entry.due_date || null,
    }).subscribe({
      next: () => { this.structSaving.update((s) => ({ ...s, [catId]: false })); this.onClassSelect(); },
      error: () => this.structSaving.update((s) => ({ ...s, [catId]: false })),
    });
  }

  deleteStructureRow(catId: string) {
    const struct = this.structures().find((s) => s.fee_category_id === catId);
    if (!struct) return;
    this.api.delete(`fees/structures/${struct.id}`).subscribe({ next: () => this.onClassSelect() });
  }

  structExists(catId: string) { return this.structures().some((s) => s.fee_category_id === catId); }

  // ── copy structure ─────────────────────────────────────────────────────────────

  otherClasses() { return this.classes().filter((c) => c.id !== this.selClassId); }

  openCopyModal() {
    this.copyTargetIds    = [];
    this.overwriteExisting = false;
    this.copyResult.set(null);
    this.showCopyModal.set(true);
  }

  toggleCopyTarget(classId: string) {
    const idx = this.copyTargetIds.indexOf(classId);
    if (idx === -1) this.copyTargetIds.push(classId);
    else            this.copyTargetIds.splice(idx, 1);
  }

  isCopyTarget(classId: string) { return this.copyTargetIds.includes(classId); }

  copyStructuresToClasses() {
    if (!this.copyTargetIds.length || !this.selClassId) return;
    this.copySaving.set(true);
    this.copyResult.set(null);
    this.api.post('fees/structures/copy', {
      source_class_id:  this.selClassId,
      target_class_ids: this.copyTargetIds,
      overwrite:        this.overwriteExisting,
    }).subscribe({
      next: (res: any) => { this.copyResult.set(res); this.copySaving.set(false); this.copyTargetIds = []; },
      error: ()        => this.copySaving.set(false),
    });
  }

  // ── collect payment ───────────────────────────────────────────────────────────

  loadStudents() {
    this.api.get<any>('users', { role: 'student', limit: '500' }).subscribe({
      next: (res) => this.allStudents.set(res.data ?? res ?? []),
    });
  }

  selectStudent(student: any) {
    this.selStudent.set(student);
    this.studentSearch.set('');
    this.feeSummary.set(null);
    this.lastReceipt.set('');
    this.loadStudentSummary(student);
    this.loadDiscounts(student.id);
    this.loadPaymentHistory(student.id);
  }

  loadStudentSummary(student: any) {
    if (!student.class_id) return;
    this.summaryLoading.set(true);
    this.api.get<any>(`fees/summary/${student.id}`, { classId: student.class_id }).subscribe({
      next: (s) => { this.feeSummary.set(s); this.summaryLoading.set(false); },
      error: () => this.summaryLoading.set(false),
    });
  }

  loadPaymentHistory(studentId: string) {
    this.api.get<any[]>(`fees/payments/${studentId}`).subscribe({ next: (p) => this.paymentHistory.set(p ?? []) });
  }

  loadDiscounts(studentId: string) {
    this.api.get<any[]>(`fees/discounts/${studentId}`).subscribe({ next: (d) => this.discounts.set(d ?? []) });
  }

  recordPayment() {
    const s = this.selStudent();
    if (!s || !this.payForm.fee_category_id || !this.payForm.amount_paid) return;
    this.paySaving.set(true);
    this.api.post('fees/payments', { ...this.payForm, student_id: s.id }).subscribe({
      next: (p: any) => {
        this.lastReceipt.set(p.receipt_number);
        this.payForm = { fee_category_id: '', amount_paid: 0, payment_date: new Date().toISOString().split('T')[0], remarks: '' };
        this.paySaving.set(false);
        this.loadStudentSummary(s);
        this.loadPaymentHistory(s.id);
      },
      error: () => this.paySaving.set(false),
    });
  }

  deletePayment(paymentId: string) {
    if (!confirm('Delete this payment record?')) return;
    const s = this.selStudent();
    this.api.delete(`fees/payments/${paymentId}`).subscribe({
      next: () => { if (s) { this.loadStudentSummary(s); this.loadPaymentHistory(s.id); } },
    });
  }

  saveDiscount() {
    const s = this.selStudent();
    if (!s || !this.discountForm.fee_category_id || !this.discountForm.discount_amount) return;
    this.discSaving.set(true);
    this.api.post('fees/discounts', { ...this.discountForm, student_id: s.id }).subscribe({
      next: () => {
        this.showDiscountModal.set(false);
        this.discSaving.set(false);
        this.loadStudentSummary(s);
        this.loadDiscounts(s.id);
        this.discountForm = { fee_category_id: '', discount_amount: 0, reason: '' };
      },
      error: () => this.discSaving.set(false),
    });
  }

  deleteDiscount(discId: string) {
    const s = this.selStudent();
    this.api.delete(`fees/discounts/${discId}`).subscribe({
      next: () => { if (s) { this.loadStudentSummary(s); this.loadDiscounts(s.id); } },
    });
  }

  clearStudent() {
    this.selStudent.set(null);
    this.feeSummary.set(null);
    this.paymentHistory.set([]);
    this.discounts.set([]);
    this.lastReceipt.set('');
  }

  balanceClass(balance: number) { return balance === 0 ? 'badge-green' : 'badge-red'; }
}
