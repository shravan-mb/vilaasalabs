import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

type AdminAttTab = 'daysheet' | 'report';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './attendance-report.html',
  styleUrl: './attendance-report.scss',
})
export class AttendanceReport implements OnInit {
  private api = inject(ApiService);

  activeTab = signal<AdminAttTab>('daysheet');
  classes   = signal<any[]>([]);
  loading   = signal(false);

  // ── Day Sheet ─────────────────────────────────────────────────────────────────
  dsClassId = '';
  dsDate    = this.today();
  daySheet  = signal<{ date: string; subjects: string[]; teacher_by_subject: Record<string, string>; rows: any[] } | null>(null);

  // ── Period Report ─────────────────────────────────────────────────────────────
  prClassId = '';
  prFrom    = this.monthStart();
  prTo      = this.today();
  prSubject = '';
  prData    = signal<any[]>([]);
  prRan     = signal(false);

  ngOnInit() {
    this.api.get<any[]>('classes').subscribe((data) =>
      this.classes.set((data ?? []).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })))
    );
  }

  loadDaySheet() {
    if (!this.dsClassId) return;
    this.loading.set(true);
    this.daySheet.set(null);
    this.api.get<any>(`attendance/class/${this.dsClassId}/day-sheet/${this.dsDate}`).subscribe({
      next: (data) => { this.daySheet.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  runReport() {
    if (!this.prClassId) return;
    this.loading.set(true);
    this.prRan.set(false);
    const params: any = { class_id: this.prClassId, from: this.prFrom, to: this.prTo };
    if (this.prSubject.trim()) params.subject = this.prSubject.trim();
    this.api.get<any[]>('attendance/class-report', params).subscribe({
      next: (data) => { this.prData.set(Array.isArray(data) ? data : []); this.loading.set(false); this.prRan.set(true); },
      error: () => this.loading.set(false),
    });
  }

  cellClass(status: string): string {
    return { present: 'ds-p', absent: 'ds-a', late: 'ds-l', holiday: 'ds-h' }[status] ?? 'ds-none';
  }

  cellLabel(status: string): string {
    return { present: 'P', absent: 'A', late: 'L', holiday: 'H' }[status] ?? '—';
  }

  subjectPresentPct(subject: string): number {
    const rows = this.daySheet()?.rows ?? [];
    if (!rows.length) return 0;
    const present = rows.filter((r: any) => {
      const c = r.cells[subject];
      return c && (c.status === 'present' || c.status === 'late');
    }).length;
    return Math.round((present / rows.length) * 100);
  }

  className(classId: string): string {
    const cls = this.classes().find((c) => c.id === classId);
    return cls ? `${cls.name}${cls.section ? ' — ' + cls.section : ''}` : '';
  }

  exportReport() {
    const rows = this.prData();
    if (!rows.length) return;
    const header = 'Student,Present Sessions,Absent Sessions,Late Sessions,Total Sessions,Attendance %';
    const lines = rows.map((r) => `"${r.student_name}",${r.present},${r.absent},${r.late},${r.total},${r.percentage}%`);
    const csv = [header, ...lines].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance-report-${this.prFrom}-${this.prTo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  printDaySheet() {
    const ds = this.daySheet();
    if (!ds || !ds.rows.length) return;
    const className = this.className(this.dsClassId);
    const genDate = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const statusColor: Record<string, string> = { P: '#16a34a', A: '#dc2626', L: '#d97706', H: '#6b7280' };
    const statusBg: Record<string, string>    = { P: '#dcfce7', A: '#fee2e2', L: '#fef3c7', H: '#f3f4f6' };

    const headerCells = ds.subjects.map(s =>
      `<th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;border:1px solid #e5e7eb">${s}<br/><span style="font-size:10px;font-weight:400;color:#9ca3af">${ds.teacher_by_subject[s] ?? ''}</span></th>`
    ).join('');

    const bodyRows = ds.rows.map((row, i) => {
      const cells = ds.subjects.map(s => {
        const c = row.cells[s];
        if (!c) return `<td style="padding:8px 10px;text-align:center;border:1px solid #e5e7eb;color:#9ca3af">—</td>`;
        const lblMap: Record<string, string> = { present: 'P', absent: 'A', late: 'L', holiday: 'H' };
        const lbl = lblMap[c.status as string] ?? '?';
        return `<td style="padding:8px 10px;text-align:center;border:1px solid #e5e7eb;background:${statusBg[lbl] ?? '#fff'};color:${statusColor[lbl] ?? '#374151'};font-weight:700">${lbl}</td>`;
      }).join('');
      return `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:500">${row.student_name}</td>
        ${cells}
        <td style="padding:8px 10px;text-align:center;border:1px solid #e5e7eb;font-weight:600;color:#7c3aed">${row.present_count}/${ds.subjects.length}</td>
      </tr>`;
    }).join('');

    const pctCells = ds.subjects.map(s => {
      const pct = this.subjectPresentPct(s);
      return `<td style="padding:8px 10px;text-align:center;border:1px solid #e5e7eb;font-weight:700;color:${pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'}">${pct}%</td>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Day Sheet — ${className} — ${this.dsDate}</title>
<style>* { box-sizing:border-box; margin:0; padding:0; } body { font-family:'Segoe UI',Arial,sans-serif; color:#1a1a1a; padding:32px; }
.header { border-bottom:3px solid #7c3aed; padding-bottom:16px; margin-bottom:20px; display:flex; justify-content:space-between; }
.no-print { display:flex; gap:10px; justify-content:center; margin-top:24px; }
@media print { .no-print { display:none !important; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<div class="header">
  <div><h2 style="font-size:20px;font-weight:700">Attendance Day Sheet</h2>
  <p style="font-size:13px;color:#6b7280;margin-top:4px">Class: <strong>${className}</strong> &nbsp;|&nbsp; Date: <strong>${this.dsDate}</strong></p></div>
  <div style="text-align:right;font-size:12px;color:#9ca3af">Generated: ${genDate}</div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:13px">
  <thead><tr style="background:#f9fafb">
    <th style="padding:8px 12px;text-align:left;border:1px solid #e5e7eb;font-size:11px;text-transform:uppercase;color:#6b7280">Student</th>
    ${headerCells}
    <th style="padding:8px 10px;font-size:11px;text-transform:uppercase;color:#6b7280;border:1px solid #e5e7eb">Present</th>
  </tr></thead>
  <tbody>${bodyRows}
    <tr style="background:#f3f0ff">
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:700;color:#7c3aed">% Present</td>
      ${pctCells}
      <td style="border:1px solid #e5e7eb"></td>
    </tr>
  </tbody>
</table>
<p style="margin-top:16px;font-size:11px;color:#9ca3af">P = Present &nbsp;|&nbsp; A = Absent &nbsp;|&nbsp; L = Late &nbsp;|&nbsp; H = Holiday &nbsp;|&nbsp; — = Not recorded</p>
<div class="no-print">
  <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
  <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer">Close</button>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 400); };</script>
</body></html>`;

    const w = window.open('', '_blank', 'width=1000,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }

  private today(): string { return new Date().toISOString().split('T')[0]; }
  private monthStart(): string { const t = this.today(); return t.substring(0, 8) + '01'; }
}
