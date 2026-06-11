import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';

function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  const inWords = (num: number): string => {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '') + ' ';
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred ' + inWords(num % 100);
    if (num < 100000) return inWords(Math.floor(num / 1000)) + 'Thousand ' + inWords(num % 1000);
    if (num < 10000000) return inWords(Math.floor(num / 100000)) + 'Lakh ' + inWords(num % 100000);
    return inWords(Math.floor(num / 10000000)) + 'Crore ' + inWords(num % 10000000);
  };
  const [rupees, paise] = String(n.toFixed(2)).split('.');
  const p = parseInt(paise, 10);
  return `Rupees ${inWords(parseInt(rupees, 10)).trim()}${p > 0 ? ` and ${inWords(p).trim()} Paise` : ''}`;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private api = inject(ApiService);

  print(paymentId: string): Observable<void> {
    return this.api.get<any>(`fees/receipts/${paymentId}`).pipe(
      tap((data) => this.openWindow(data)),
      map(() => undefined),
    );
  }

  openWindow(r: any): void {
    const fmt = (n: number | null) => n != null ? '₹' + n.toLocaleString('en-IN') : '—';

    const logoHtml = r.institution.logo_url
      ? `<img src="${r.institution.logo_url}" alt="logo" class="logo-img" />`
      : `<div class="logo-placeholder">${(r.institution.name || 'S').charAt(0).toUpperCase()}</div>`;

    const payDate = r.payment_date
      ? new Date(r.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '—';

    const genDate = new Date(r.generated_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const amountWords = numberToWords(Number(r.amount_paid));

    // Compute hasDiscount BEFORE building rows so it can be used inside each row
    const feeSummaryArr: any[] = r.fee_summary ?? [];
    const totals = r.totals ?? {};
    const totalBalance = totals.balance ?? r.balance_after ?? 0;
    const hasDiscount = feeSummaryArr.some((row: any) => row.discount_amount > 0);

    const feeRows = feeSummaryArr.map((row: any) => {
      const isPaidRow = row.fee_category_id === r.fee_category_id_paid;
      const balColor = row.balance === 0 ? '#16a34a' : '#dc2626';
      return `<tr class="${isPaidRow ? 'current-payment-row' : ''}">
        <td>${row.category_name}<span class="freq-badge">${row.frequency ?? ''}</span></td>
        <td class="num">${fmt(row.standard_amount)}</td>
        ${hasDiscount ? `<td class="num" style="color:#16a34a">${row.discount_amount > 0 ? '- ' + fmt(row.discount_amount) : '—'}</td>` : ''}
        <td class="num">${fmt(row.net_due)}</td>
        <td class="num" style="color:#16a34a">${fmt(row.paid)}</td>
        <td class="num" style="color:${balColor};font-weight:600">${row.balance === 0 ? '✓ Clear' : fmt(row.balance)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Receipt ${r.receipt_number}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; }
  .page { max-width: 700px; margin: 0 auto; padding: 32px 28px; }
  .header { display: flex; align-items: flex-start; gap: 20px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 24px; }
  .logo-img { width: 72px; height: 72px; border-radius: 8px; object-fit: contain; border: 1px solid #e5e7eb; }
  .logo-placeholder { width: 72px; height: 72px; border-radius: 8px; background: #7c3aed; color: #fff; font-size: 32px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .inst-info { flex: 1; }
  .inst-name { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .inst-meta { font-size: 12px; color: #6b7280; line-height: 1.7; }
  .receipt-badge { text-align: right; flex-shrink: 0; }
  .receipt-title { font-size: 13px; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: .08em; margin-bottom: 4px; }
  .receipt-number { font-size: 18px; font-weight: 700; color: #1a1a1a; font-family: monospace; }
  .receipt-date { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #7c3aed; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
  .info-row { display: flex; flex-direction: column; gap: 2px; }
  .info-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: .04em; }
  .info-value { font-size: 14px; color: #1a1a1a; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  table th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; }
  table th.num, table td.num { text-align: right; }
  table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
  .current-payment-row td { background: #faf5ff; }
  .freq-badge { font-size: 10px; color: #9ca3af; margin-left: 5px; }
  .totals-row td { font-weight: 700; border-top: 2px solid #e5e7eb; background: #f9fafb; }
  .amount-paid-box { display: flex; justify-content: space-between; align-items: center; background: #f5f3ff; border: 2px solid #7c3aed; border-radius: 8px; padding: 12px 16px; margin-top: 12px; }
  .amount-paid-label { font-size: 15px; font-weight: 700; color: #7c3aed; }
  .amount-paid-value { font-size: 20px; font-weight: 800; color: #7c3aed; }
  .amount-words { font-size: 12px; color: #6b7280; font-style: italic; padding: 8px 12px; background: #fafafa; border: 1px solid #f3f4f6; border-radius: 6px; margin-top: 8px; }
  .sig-row { display: flex; gap: 40px; margin-top: 40px; }
  .sig-block { flex: 1; border-top: 1.5px solid #d1d5db; padding-top: 10px; }
  .sig-name { font-size: 15px; font-weight: 600; font-style: italic; color: #1a1a1a; font-family: Georgia, serif; margin-bottom: 2px; }
  .sig-title { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; }
  .footer { margin-top: 28px; padding-top: 14px; border-top: 1px dashed #d1d5db; }
  .footer-note { font-size: 11px; color: #9ca3af; line-height: 1.6; }
  .watermark-paid { position: fixed; top: 40%; left: 50%; transform: translate(-50%,-50%) rotate(-30deg); font-size: 96px; font-weight: 900; color: rgba(22,163,74,.07); pointer-events: none; white-space: nowrap; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } .page { padding: 16px; } }
</style>
</head>
<body>
${totalBalance === 0 ? '<div class="watermark-paid">PAID</div>' : ''}
<div class="page">
  <div class="header">
    <div style="display:flex;align-items:center;gap:16px;flex:1">
      ${logoHtml}
      <div class="inst-info">
        <div class="inst-name">${r.institution.name}</div>
        <div class="inst-meta">
          ${r.institution.registration_number ? `Reg: ${r.institution.registration_number}<br/>` : ''}
          ${r.institution.address || ''}<br/>
          ${r.institution.phone ? `📞 ${r.institution.phone}` : ''}
          ${r.institution.phone && r.institution.email ? ' &nbsp;|&nbsp; ' : ''}
          ${r.institution.email ? `✉ ${r.institution.email}` : ''}
        </div>
      </div>
    </div>
    <div class="receipt-badge">
      <div class="receipt-title">Payment Receipt</div>
      <div class="receipt-number">${r.receipt_number}</div>
      <div class="receipt-date">Date: ${payDate}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Student Details</div>
    <div class="info-grid">
      <div class="info-row"><span class="info-label">Student Name</span><span class="info-value">${r.student.name}</span></div>
      <div class="info-row"><span class="info-label">Registration No.</span><span class="info-value">${r.student.registration_number || '—'}</span></div>
      <div class="info-row"><span class="info-label">Grade / Section</span><span class="info-value">${r.student.class_name || '—'}</span></div>
      <div class="info-row"><span class="info-label">Payment Mode</span><span class="info-value">${r.payment_mode?.toUpperCase()}</span></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Fee Structure &amp; Payment Status</div>
    <table>
      <thead>
        <tr>
          <th>Fee Category</th>
          <th class="num">Amount Due</th>
          ${hasDiscount ? '<th class="num">Discount</th>' : ''}
          <th class="num">Net Payable</th>
          <th class="num">Paid So Far</th>
          <th class="num">Remaining</th>
        </tr>
      </thead>
      <tbody>
        ${feeRows}
        ${feeSummaryArr.length > 1 ? `<tr class="totals-row">
          <td>Grand Total</td>
          <td class="num">${fmt(totals.standard ?? feeSummaryArr.reduce((s: number, r: any) => s + (r.standard_amount ?? 0), 0))}</td>
          ${hasDiscount ? `<td class="num" style="color:#16a34a">- ${fmt(totals.discount ?? 0)}</td>` : ''}
          <td class="num">${fmt(totals.net_due ?? feeSummaryArr.reduce((s: number, r: any) => s + (r.net_due ?? 0), 0))}</td>
          <td class="num" style="color:#16a34a">${fmt(totals.paid ?? feeSummaryArr.reduce((s: number, r: any) => s + (r.paid ?? 0), 0))}</td>
          <td class="num" style="color:${totalBalance === 0 ? '#16a34a' : '#dc2626'};font-weight:700">${totalBalance === 0 ? '✓ Fully Paid' : fmt(totalBalance)}</td>
        </tr>` : ''}
      </tbody>
    </table>
    <div class="amount-paid-box">
      <span class="amount-paid-label">Amount Paid — ${r.fee_category_name}</span>
      <span class="amount-paid-value">${fmt(r.amount_paid)}</span>
    </div>
    <div class="amount-words">Amount in words: <strong>${amountWords} Only</strong></div>
    ${r.remarks ? `<div style="margin-top:8px;font-size:12px;color:#6b7280">Remarks: ${r.remarks}</div>` : ''}
  </div>
  <div class="sig-row">
    <div class="sig-block">
      <div class="sig-name">${r.collector_name}</div>
      <div class="sig-title">Fee Collector</div>
    </div>
    <div class="sig-block" style="text-align:right">
      <div class="sig-name">${r.institution.principal_name || 'Principal'}</div>
      <div class="sig-title">Principal / Authorised Signatory</div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-note">✦ This is a computer-generated receipt and is valid without a physical signature.<br/>Generated on ${genDate}</div>
  </div>
  <div class="no-print" style="margin-top:24px;text-align:center;display:flex;gap:12px;justify-content:center">
    <button onclick="window.print()" style="padding:10px 28px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer">🖨 Print / Save as PDF</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer">Close</button>
  </div>
</div>
<script>window.onload = function() { setTimeout(function() { window.print(); }, 600); };</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=780,height=900');
    if (w) { w.document.write(html); w.document.close(); }
  }
}
