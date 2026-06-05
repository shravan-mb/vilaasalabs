import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminApiService, Institution } from '../../../core/services/admin-api.service';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './broadcast.html',
  styleUrl: './broadcast.scss',
})
export class BroadcastPage implements OnInit {
  schools = signal<Institution[]>([]);
  selectedIds = new Set<string>();
  sendToAll = true;
  subject = '';
  body = '';
  sending = signal(false);
  msg = signal('');
  err = signal('');

  constructor(private api: AdminApiService) {}

  ngOnInit() {
    this.api.listInstitutions(1, 200).subscribe({ next: (res) => this.schools.set(res.data) });
  }

  toggleAll(checked: boolean) { this.sendToAll = checked; this.selectedIds.clear(); }
  toggleSchool(id: string, checked: boolean) { checked ? this.selectedIds.add(id) : this.selectedIds.delete(id); }
  isSelected(id: string) { return this.selectedIds.has(id); }

  send() {
    if (!this.subject.trim() || !this.body.trim()) { this.err.set('Subject and message are required'); return; }
    this.sending.set(true); this.msg.set(''); this.err.set('');
    const institution_ids = this.sendToAll ? [] : [...this.selectedIds];
    this.api.broadcast({ subject: this.subject, body: this.body, institution_ids }).subscribe({
      next: (res: any) => { this.msg.set(`Email sent to ${res.sent} institution(s)`); this.sending.set(false); this.subject = ''; this.body = ''; },
      error: () => { this.err.set('Failed to send broadcast'); this.sending.set(false); },
    });
  }
}
