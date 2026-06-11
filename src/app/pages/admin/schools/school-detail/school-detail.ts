import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminApiService, Institution } from '../../../../core/services/admin-api.service';

const PLAN_PRICES: Record<string, Record<string, number>> = {
  trial:   { monthly: 0,     annual: 0     },
  starter: { monthly: 799,   annual: 7990  },
  growth:  { monthly: 1999,  annual: 19990 },
  pro:     { monthly: 4499,  annual: 44990 },
  pro_max: { monthly: 8999,  annual: 89990 },
};

export const PLANS = [
  { value: 'trial',   label: 'Trial',    monthly: 0,     annual: 0     },
  { value: 'starter', label: 'Starter',  monthly: 799,   annual: 7990  },
  { value: 'growth',  label: 'Growth',   monthly: 1999,  annual: 19990 },
  { value: 'pro',     label: 'Pro',      monthly: 4499,  annual: 44990 },
  { value: 'pro_max', label: 'Pro Max (up to 5,000 students)',  monthly: 8999,  annual: 89990 },
];

const FLAG_DEFINITIONS: { key: string; label: string; description: string }[] = [
  {
    key: 'show_subscription_tab',
    label: 'Subscription Tab',
    description: 'Show the Subscription & billing tab to the school admin. Disable this when you manage payments manually.',
  },
];

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
  flagSaving = signal(false);
  deleting = signal(false);
  showDeleteModal = signal(false);
  deleteConfirmInput = '';
  msg = signal('');
  err = signal('');
  activeTab = signal<'info' | 'subscription' | 'users' | 'settings'>('info');

  contentAccess = signal<any[]>([]);
  contentAccessLoading = signal(false);
  savingContentAccess = signal<Record<string, boolean>>({});

  plans = PLANS;
  flagDefs = FLAG_DEFINITIONS;

  editForm: Partial<Institution> = {};
  subForm = { plan: 'starter', billing_cycle: 'monthly', duration_months: 1, amount: 999 };
  featureFlags: Record<string, boolean> = { show_subscription_tab: true };

  constructor(private api: AdminApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() { this.load(); }

  load() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getInstitution(id).subscribe({
      next: (s) => {
        this.school.set(s);
        this.editForm = { name: s.name, email: s.email, phone: s.phone, city: s.city, state: s.state, address: s.address, principal_name: s.principal_name, registration_number: s.registration_number };
        this.subForm.plan = s.subscription_plan ?? 'starter';
        this.subForm.billing_cycle = 'monthly';
        this.subForm.duration_months = 1;
        this.subForm.amount = PLAN_PRICES[this.subForm.plan]?.['monthly'] ?? 0;
        const defaults: Record<string, boolean> = { show_subscription_tab: true };
        this.featureFlags = { ...defaults, ...((s as any).feature_flags ?? {}) };
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPlanOrBillingChange() {
    const price = PLAN_PRICES[this.subForm.plan]?.[this.subForm.billing_cycle] ?? 0;
    this.subForm.amount = price;
    this.subForm.duration_months = this.subForm.billing_cycle === 'annual' ? 12 : 1;
  }

  priceLabel(): string {
    const p = PLAN_PRICES[this.subForm.plan];
    if (!p) return '';
    if (this.subForm.plan === 'trial') return 'Free trial period';
    return `₹${p['monthly'].toLocaleString('en-IN')}/mo  ·  ₹${p['annual'].toLocaleString('en-IN')}/yr`;
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

  saveFlags() {
    const id = this.school()!.id;
    this.flagSaving.set(true);
    this.api.updateFeatureFlags(id, this.featureFlags).subscribe({
      next: () => { this.msg.set('Settings saved'); this.flagSaving.set(false); setTimeout(() => this.msg.set(''), 3000); },
      error: () => { this.err.set('Failed to save settings'); this.flagSaving.set(false); },
    });
  }

  suspend() { this.api.suspendInstitution(this.school()!.id).subscribe({ next: () => this.load() }); }
  reactivate() { this.api.reactivateInstitution(this.school()!.id).subscribe({ next: () => this.load() }); }

  confirmDelete() {
    if (this.deleteConfirmInput !== this.school()!.name) return;
    this.deleting.set(true);
    this.api.deleteInstitution(this.school()!.id).subscribe({
      next: () => this.router.navigate(['/admin/schools']),
      error: () => { this.err.set('Failed to delete institution'); this.deleting.set(false); this.showDeleteModal.set(false); },
    });
  }

  userEntries() {
    const counts = (this.school() as any)?.user_counts ?? {};
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }

  loadContentAccess() {
    const id = this.school()?.id; if (!id) return;
    this.contentAccessLoading.set(true);
    this.api.getInstitutionContentAccess(id).subscribe({
      next: (data) => { this.contentAccess.set(data); this.contentAccessLoading.set(false); },
      error: () => this.contentAccessLoading.set(false),
    });
  }

  toggleContentAccess(boardId: string, isEnabled: boolean) {
    const id = this.school()?.id; if (!id) return;
    this.savingContentAccess.update((s) => ({ ...s, [boardId]: true }));
    this.api.setInstitutionContentAccess(id, boardId, isEnabled).subscribe({
      next: () => {
        this.savingContentAccess.update((s) => ({ ...s, [boardId]: false }));
        this.loadContentAccess();
      },
      error: () => this.savingContentAccess.update((s) => ({ ...s, [boardId]: false })),
    });
  }
}
