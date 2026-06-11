import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReceiptService } from '../../../core/services/receipt.service';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './students.html',
  styleUrl: './students.scss',
})
export class StudentsPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private receiptSvc = inject(ReceiptService);

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  // All classes (loaded once)
  classes = signal<any[]>([]);
  teachers = signal<any[]>([]);
  loading = signal(true);

  // Per-class student cache: classId → student[]
  studentsByClass = signal<Record<string, any[]>>({});
  loadingClass = signal<Record<string, boolean>>({});

  // Expanded classes
  expandedClasses = signal<Set<string>>(new Set());

  // Academic year filter
  filterYear = signal('');

  academicYears = computed(() => {
    const years = [...new Set(this.classes().map((c) => c.academic_year).filter(Boolean))];
    return years.sort().reverse();
  });

  sortedClasses = computed(() => {
    const year = this.filterYear();
    const list = year ? this.classes().filter((c) => c.academic_year === year) : this.classes();
    return [...list].sort((a, b) => {
      const aNum = parseInt(a.name.match(/\d+/)?.[0] ?? '0', 10) || 0;
      const bNum = parseInt(b.name.match(/\d+/)?.[0] ?? '0', 10) || 0;
      if (aNum !== bNum) return aNum - bNum;
      return (a.section || '').localeCompare(b.section || '');
    });
  });

  // Add / edit forms
  showForm = signal(false);
  saving = signal(false);
  error = signal('');
  form = { name: '', email: '', phone: '', password: 'Student@1234', role: 'student', class_id: '', proctor_id: '', registration_number: '' };
  touched: Record<string, boolean> = {};

  editTarget = signal<any>(null);
  editForm = { name: '', email: '', phone: '', class_id: '', proctor_id: '', registration_number: '' };
  editSaving = signal(false);

  passwordTarget = signal<any>(null);
  newPassword = '';
  passwordSaving = signal(false);

  // Global student search
  globalSearch = '';
  globalSearchResults = signal<any[]>([]);
  globalSearchLoading = signal(false);
  private globalSearchSubject = new Subject<string>();

  // Parent section state
  parentMode: 'none' | 'existing' | 'new' = 'none';
  parentSearch = '';
  parentSearchResults = signal<any[]>([]);
  parentSearchLoading = signal(false);
  selectedParent = signal<any>(null);
  newParentForm = { name: '', phone: '' };
  private parentSearchSubject = new Subject<string>();

  bulkProctorClassId = '';
  bulkProctorTeacherId = '';
  showBulkProctor = signal(false);
  bulkAssigning = signal(false);

  // Fee view modal
  feeViewStudent = signal<any>(null);
  feeSummary = signal<any[]>([]);
  feePayments = signal<any[]>([]);
  feeModalLoading = signal(false);
  feeReceiptLoading = signal<string | null>(null);

  // Helper to get class name from id using already-loaded classes
  classNameById(classId: string): string {
    if (!classId) return '—';
    const cls = this.classes().find(c => c.id === classId);
    return cls ? cls.name + (cls.section ? ' — ' + cls.section : '') : '—';
  }

  onGlobalSearchInput() {
    this.globalSearchSubject.next(this.globalSearch);
  }

  clearGlobalSearch() {
    this.globalSearch = '';
    this.globalSearchResults.set([]);
    this.globalSearchSubject.next('');
  }

  ngOnInit() {
    this.loadClasses();
    this.loadTeachers();

    // Global student search (name OR reg number)
    this.globalSearchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      if (!q.trim()) { this.globalSearchResults.set([]); this.globalSearchLoading.set(false); return; }
      this.globalSearchLoading.set(true);
      this.api.get<any>('users', { role: 'student', search: q, limit: '30' }).subscribe({
        next: (res: any) => { this.globalSearchResults.set(res.data ?? res); this.globalSearchLoading.set(false); },
        error: () => this.globalSearchLoading.set(false),
      });
    });

    this.parentSearchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe((q) => {
      if (!q.trim()) { this.parentSearchResults.set([]); this.parentSearchLoading.set(false); return; }
      this.parentSearchLoading.set(true);
      this.api.get<any>('users', { role: 'parent', search: q, limit: '10' }).subscribe({
        next: (res: any) => { this.parentSearchResults.set(res.data ?? res); this.parentSearchLoading.set(false); },
        error: () => this.parentSearchLoading.set(false),
      });
    });
  }

  loadClasses() {
    this.loading.set(true);
    this.api.get<any[]>('classes').subscribe({
      next: (data) => { this.classes.set(data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadTeachers() {
    this.api.get<any>('users', { role: 'teacher', limit: '200' }).subscribe({
      next: (res: any) => {
        const list: any[] = res.data ?? res;
        this.teachers.set([...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')));
      },
    });
  }

  toggleClass(classId: string) {
    this.expandedClasses.update((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) { next.delete(classId); return next; }
      next.add(classId);
      return next;
    });
    // Lazy-load students for this class
    if (!this.studentsByClass()[classId]) {
      this.loadStudentsForClass(classId);
    }
  }

  loadStudentsForClass(classId: string) {
    this.loadingClass.update((s) => ({ ...s, [classId]: true }));
    this.api.get<any[]>(`users/class/${classId}`).subscribe({
      next: (data) => {
        this.studentsByClass.update((m) => ({ ...m, [classId]: data ?? [] }));
        this.loadingClass.update((s) => ({ ...s, [classId]: false }));
      },
      error: () => this.loadingClass.update((s) => ({ ...s, [classId]: false })),
    });
  }

  isExpanded(classId: string) { return this.expandedClasses().has(classId); }
  studentsFor(classId: string) { return this.studentsByClass()[classId] ?? []; }
  isLoadingClass(classId: string) { return this.loadingClass()[classId] ?? false; }

  touch(f: string) { this.touched[f] = true; }

  isInvalid(f: string): boolean {
    if (!this.touched[f]) return false;
    if (f === 'name') return !this.form.name.trim();
    if (f === 'registration_number') return !this.form.registration_number.trim();
    if (f === 'class_id') return !this.form.class_id;
    if (f === 'email') return !!this.form.email && !this.form.email.includes('@');
    if (f === 'password') return this.form.password.length < 8;
    return false;
  }

  setParentMode(mode: 'none' | 'existing' | 'new') {
    this.parentMode = mode;
    this.parentSearch = '';
    this.parentSearchResults.set([]);
    this.selectedParent.set(null);
    this.newParentForm = { name: '', phone: '' };
  }

  onParentSearchInput() {
    this.selectedParent.set(null);
    this.parentSearchSubject.next(this.parentSearch);
  }

  selectParent(p: any) {
    this.selectedParent.set(p);
    this.parentSearch = `${p.name} — ${p.phone}`;
    this.parentSearchResults.set([]);
  }

  onSubmit() {
    ['name', 'registration_number', 'class_id', 'password'].forEach((f) => this.touch(f));
    if (['name', 'registration_number', 'class_id', 'password'].some((f) => this.isInvalid(f))) return;
    if (this.form.email) { this.touch('email'); if (this.isInvalid('email')) return; }

    // Validate parent section
    if (this.parentMode === 'new' && (!this.newParentForm.name.trim() || !this.newParentForm.phone.trim())) {
      this.error.set('Parent name and phone are required'); setTimeout(() => this.error.set(''), 4000); return;
    }
    if (this.parentMode === 'existing' && !this.selectedParent()) {
      this.error.set('Please select a parent from the search results'); setTimeout(() => this.error.set(''), 4000); return;
    }

    this.saving.set(true);
    this.error.set('');
    const payload: any = { name: this.form.name, phone: this.form.phone, password: this.form.password, role: 'student' };
    if (this.form.email) payload.email = this.form.email;
    if (this.form.class_id) payload.class_id = this.form.class_id;
    if (this.form.proctor_id) payload.proctor_id = this.form.proctor_id;
    if (this.form.registration_number) payload.registration_number = this.form.registration_number;

    this.api.post<any>('users', payload).subscribe({
      next: (student: any) => {
        const studentId = student.id;
        const afterLink = () => {
          this.toast.success('Student added successfully');
          this.saving.set(false);
          this.showForm.set(false);
          this.form = { name: '', email: '', phone: '', password: 'Student@1234', role: 'student', class_id: '', proctor_id: '', registration_number: '' };
          this.touched = {};
          this.setParentMode('none');
          if (payload.class_id) this.loadStudentsForClass(payload.class_id);
        };

        if (this.parentMode === 'existing' && this.selectedParent()) {
          this.api.post(`users/${studentId}/link-parent`, { parent_id: this.selectedParent().id }).subscribe({ next: afterLink, error: afterLink });
        } else if (this.parentMode === 'new') {
          const parentPayload = { name: this.newParentForm.name, phone: this.newParentForm.phone, password: 'Parents@1234', role: 'parent' };
          this.api.post<any>('users', parentPayload).subscribe({
            next: (parent: any) => {
              this.api.post(`users/${studentId}/link-parent`, { parent_id: parent.id }).subscribe({ next: afterLink, error: afterLink });
            },
            error: (err) => { this.error.set(err.error?.message || 'Student saved but failed to create parent'); this.saving.set(false); if (payload.class_id) this.loadStudentsForClass(payload.class_id); },
          });
        } else {
          afterLink();
        }
      },
      error: (err) => { this.error.set(err.error?.message || 'Failed to add student'); this.saving.set(false); setTimeout(() => this.error.set(''), 4000); },
    });
  }

  openEdit(s: any) {
    this.editForm = { name: s.name, email: s.email ?? '', phone: s.phone ?? '', class_id: s.class_id ?? '', proctor_id: s.proctor_id ?? '', registration_number: s.registration_number ?? '' };
    this.editTarget.set(s);
  }

  saveEdit() {
    if (!this.editForm.name.trim()) { this.toast.error('Name is required'); return; }
    this.editSaving.set(true);
    const payload: any = { name: this.editForm.name, phone: this.editForm.phone };
    if (this.editForm.email) payload.email = this.editForm.email;
    if (this.editForm.class_id) payload.class_id = this.editForm.class_id;
    payload.proctor_id = this.editForm.proctor_id || null;
    payload.registration_number = this.editForm.registration_number || null;
    this.api.patch(`users/${this.editTarget().id}`, payload).subscribe({
      next: () => {
        this.toast.success('Student updated');
        const oldClassId = this.editTarget().class_id;
        this.editTarget.set(null);
        this.editSaving.set(false);
        if (oldClassId) this.loadStudentsForClass(oldClassId);
        if (payload.class_id && payload.class_id !== oldClassId) this.loadStudentsForClass(payload.class_id);
      },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to update'); this.editSaving.set(false); },
    });
  }

  openResetPassword(s: any) { this.newPassword = ''; this.passwordTarget.set(s); }

  savePassword() {
    if (this.newPassword.length < 8) { this.toast.error('Password must be at least 8 characters'); return; }
    this.passwordSaving.set(true);
    this.api.patch(`users/${this.passwordTarget().id}/set-password`, { new_password: this.newPassword }).subscribe({
      next: () => { this.toast.success('Password updated'); this.passwordTarget.set(null); this.passwordSaving.set(false); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to update password'); this.passwordSaving.set(false); },
    });
  }

  deactivate(student: any) {
    this.api.patch(`users/${student.id}/deactivate`, {}).subscribe({
      next: () => { if (student.class_id) this.loadStudentsForClass(student.class_id); }
    });
  }

  activate(student: any) {
    this.api.patch(`users/${student.id}/activate`, {}).subscribe({
      next: () => { if (student.class_id) this.loadStudentsForClass(student.class_id); }
    });
  }

  delete(student: any) {
    if (!confirm('Delete this student permanently?')) return;
    this.api.delete(`users/${student.id}`).subscribe({
      next: () => {
        this.toast.success('Student deleted');
        if (student.class_id) this.loadStudentsForClass(student.class_id);
      },
      error: (err) => this.toast.error(err.error?.message || 'Failed to delete'),
    });
  }

  className(classId: string): string {
    const cls = this.classes().find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ' — ' + cls.section : ''}` : '—';
  }

  teacherName(teacherId: string | null): string {
    if (!teacherId) return '—';
    return this.teachers().find((t) => t.id === teacherId)?.name ?? '—';
  }

  openBulkProctor() { this.bulkProctorClassId = ''; this.bulkProctorTeacherId = ''; this.showBulkProctor.set(true); }

  saveBulkProctor() {
    if (!this.bulkProctorClassId || !this.bulkProctorTeacherId) { this.toast.error('Select a class and a teacher'); return; }
    this.bulkAssigning.set(true);
    this.api.patch('users/bulk-proctor', { class_id: this.bulkProctorClassId, proctor_id: this.bulkProctorTeacherId }).subscribe({
      next: (res: any) => {
        this.toast.success(`Proctor assigned to ${res.updated} students`);
        this.showBulkProctor.set(false);
        this.bulkAssigning.set(false);
        this.loadStudentsForClass(this.bulkProctorClassId);
      },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to assign proctor'); this.bulkAssigning.set(false); },
    });
  }

  openFeeView(student: any) {
    this.feeViewStudent.set(student);
    this.feeSummary.set([]);
    this.feePayments.set([]);
    this.feeModalLoading.set(true);
    forkJoin([
      this.api.get<any[]>(`fees/summary/${student.id}`, student.class_id ? { classId: student.class_id } : {}),
      this.api.get<any[]>(`fees/payments/${student.id}`),
    ]).subscribe({
      next: ([summary, payments]: [any, any[]]) => {
        const rows: any[] = Array.isArray(summary) ? summary : (summary?.rows ?? []);
        this.feeSummary.set(rows);
        this.feePayments.set([...(payments ?? [])].reverse());
        this.feeModalLoading.set(false);
      },
      error: () => { this.toast.error('Failed to load fee details'); this.feeModalLoading.set(false); },
    });
  }

  closeFeeView() { this.feeViewStudent.set(null); }

  printStudentReceipt(paymentId: string) {
    this.feeReceiptLoading.set(paymentId);
    this.receiptSvc.print(paymentId).subscribe({
      next: () => this.feeReceiptLoading.set(null),
      error: () => { this.toast.error('Failed to load receipt'); this.feeReceiptLoading.set(null); },
    });
  }

  feeSummaryTotals() {
    const rows = this.feeSummary();
    return {
      standard: rows.reduce((s, r) => s + (r.standard_amount ?? 0), 0),
      discount: rows.reduce((s, r) => s + (r.discount_amount ?? 0), 0),
      net_due: rows.reduce((s, r) => s + (r.net_due ?? 0), 0),
      paid: rows.reduce((s, r) => s + (r.paid ?? 0), 0),
      balance: rows.reduce((s, r) => s + (r.balance ?? 0), 0),
    };
  }

  printFeeStatement() {
    const student = this.feeViewStudent();
    if (!student) return;
    const summary = this.feeSummary();
    const payments = this.feePayments();
    const fmt = (n: number) => '₹' + n.toLocaleString('en-IN');
    const totals = this.feeSummaryTotals();
    const genDate = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const clsName = this.className(student.class_id);

    const summaryRows = summary.map(r => {
      const balColor = r.balance === 0 ? '#16a34a' : '#dc2626';
      return `<tr>
        <td>${r.category_name}<span style="font-size:10px;color:#9ca3af;margin-left:5px">${r.frequency ?? ''}</span></td>
        <td class="num">${fmt(r.standard_amount ?? 0)}</td>
        <td class="num" style="color:#16a34a">${r.discount_amount > 0 ? '- ' + fmt(r.discount_amount) : '—'}</td>
        <td class="num">${fmt(r.net_due ?? 0)}</td>
        <td class="num" style="color:#16a34a">${fmt(r.paid ?? 0)}</td>
        <td class="num" style="color:${balColor};font-weight:600">${r.balance === 0 ? '✓ Paid' : fmt(r.balance)}</td>
      </tr>`;
    }).join('');

    const totalsRow = summary.length ? `<tr style="font-weight:700;border-top:2px solid #e5e7eb;background:#f9fafb">
      <td>Total</td>
      <td class="num">${fmt(totals.standard)}</td>
      <td class="num" style="color:#16a34a">${totals.discount > 0 ? '- ' + fmt(totals.discount) : '—'}</td>
      <td class="num">${fmt(totals.net_due)}</td>
      <td class="num" style="color:#16a34a">${fmt(totals.paid)}</td>
      <td class="num" style="color:${totals.balance === 0 ? '#16a34a' : '#dc2626'};font-weight:700">${totals.balance === 0 ? '✓ Fully Paid' : fmt(totals.balance)}</td>
    </tr>` : '';

    const paymentRows = payments.map(p => {
      const d = p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
      return `<tr>
        <td>${d}</td>
        <td style="font-family:monospace;font-size:12px;color:#6b7280">${p.receipt_number}</td>
        <td>${p.fee_category?.name ?? '—'}</td>
        <td>${p.payment_mode}</td>
        <td class="num" style="color:#16a34a;font-weight:600">${fmt(p.amount_paid)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>Fee Statement — ${student.name}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a1a; background:#fff; }
  .page { max-width:780px; margin:0 auto; padding:32px 28px; }
  .header { border-bottom:3px solid #7c3aed; padding-bottom:16px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end; }
  .title { font-size:22px; font-weight:700; }
  .sub { font-size:13px; color:#6b7280; margin-top:4px; }
  .meta { text-align:right; font-size:12px; color:#6b7280; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#7c3aed; margin:20px 0 8px; padding-bottom:4px; border-bottom:1px solid #e5e7eb; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th { background:#f3f4f6; padding:8px 10px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#6b7280; }
  td { padding:8px 10px; border-bottom:1px solid #f3f4f6; }
  .num { text-align:right; }
  .footer { margin-top:24px; padding-top:12px; border-top:1px dashed #d1d5db; font-size:11px; color:#9ca3af; }
  .no-print { display:flex; gap:10px; justify-content:center; margin-top:24px; }
  @media print { .no-print { display:none !important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head>
<body><div class="page">
  <div class="header">
    <div>
      <div class="title">Fee Statement</div>
      <div class="sub">
        <strong>${student.name}</strong>
        ${student.registration_number ? ' &nbsp;·&nbsp; Reg: ' + student.registration_number : ''}
        &nbsp;·&nbsp; ${clsName}
      </div>
    </div>
    <div class="meta">Generated: ${genDate}</div>
  </div>
  ${summary.length ? `
  <div class="section-title">Fee Structure</div>
  <table>
    <thead><tr><th>Category</th><th class="num">Standard</th><th class="num">Discount</th><th class="num">Net Due</th><th class="num">Total Paid</th><th class="num">Balance</th></tr></thead>
    <tbody>${summaryRows}${totalsRow}</tbody>
  </table>` : '<p style="font-size:13px;color:#6b7280;margin-top:8px">No fee structure configured for this class.</p>'}
  ${payments.length ? `
  <div class="section-title">Payment History</div>
  <table>
    <thead><tr><th>Date</th><th>Receipt No.</th><th>Category</th><th>Mode</th><th class="num">Amount Paid</th></tr></thead>
    <tbody>${paymentRows}</tbody>
  </table>` : '<p style="font-size:13px;color:#6b7280;margin-top:16px">No payments recorded.</p>'}
  <div class="footer">✦ This is a computer-generated fee statement.</div>
  <div class="no-print">
    <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer">Close</button>
  </div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},400);};</script>
</body></html>`;

    const w = window.open('', '_blank', 'width=820,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }
}
