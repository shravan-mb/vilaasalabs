import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminApiService, Institution } from '../../../../core/services/admin-api.service';

@Component({
  selector: 'app-school-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './school-detail.html',
  styleUrl: './school-detail.scss',
})
export class SchoolDetail implements OnInit {
  school = signal<Institution | null>(null);
  loading = signal(true);
  saving = signal(false);
  msg = signal('');
  err = signal('');
  activeTab = signal<'info' | 'subscription' | 'users'>('info');

  editForm: Partial<Institution> = {};
  subForm = { plan: 'starter', billing_cycle: 'monthly', duration_months: 1, amount: 0 };

  constructor(private api: AdminApiService, private route: ActivatedRoute) {}

  ngOnInit() { this.load(); }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getInstitution(id).subscribe({
      next: (s) => { this.school.set(s); this.editForm = { name: s.name, email: s.email, phone: s.phone, city: s.city, state: s.state, address: s.address, principal_name: s.principal_name }; this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  saveInfo() {
    const id = this.school()!.id;
    this.saving.set(true); this.err.set('');
    this.api.updateInstitution(id, this.editForm).subscribe({
      next: () => { this.msg.set('Saved successfully'); this.saving.set(false); setTimeout(() => this.msg.set(''), 3000); this.load(); },
      error: () => { this.err.set('Failed to save'); this.saving.set(false); },
    });
  }

  changeSub() {
    const id = this.school()!.id;
    this.saving.set(true); this.err.set('');
    this.api.changeSubscription(id, this.subForm).subscribe({
      next: () => { this.msg.set('Subscription updated'); this.saving.set(false); setTimeout(() => this.msg.set(''), 3000); this.load(); },
      error: () => { this.err.set('Failed to update subscription'); this.saving.set(false); },
    });
  }

  suspend() { this.api.suspendInstitution(this.school()!.id).subscribe({ next: () => this.load() }); }
  reactivate() { this.api.reactivateInstitution(this.school()!.id).subscribe({ next: () => this.load() }); }

  userEntries() {
    const counts = (this.school() as any)?.user_counts ?? {};
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }
}
