import { DatePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

declare var Razorpay: any;

const PLAN_PRICES: Record<string, Record<string, number>> = {
  starter: { monthly: 999,    annual: 9999 },
  growth:  { monthly: 2499,   annual: 24999 },
  pro:     { monthly: 4999,   annual: 49999 },
  pro_max: { monthly: 0,      annual: 99999 },
};

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, FormsModule],
  templateUrl: './subscription.html',
  styleUrl: './subscription.scss',
})
export class SubscriptionPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);

  current = signal<any>(null);
  limits = signal<any>(null);
  history = signal<any[]>([]);
  loading = signal(true);
  showUpgrade = signal(false);
  paymentLoading = signal(false);
  error = signal('');
  success = signal('');

  selectedPlan = 'starter';
  selectedCycle = 'monthly';
  plans = ['starter', 'growth', 'pro', 'pro_max'];
  cycles = ['monthly', 'annual'];

  readonly PLAN_LIMITS: Record<string, { students: number | string; teachers: number | string; label: string }> = {
    starter: { students: 50,   teachers: 3,   label: 'Up to 50 students, 3 teachers' },
    growth:  { students: 200,  teachers: 10,  label: 'Up to 200 students, 10 teachers' },
    pro:     { students: 9999, teachers: 999, label: 'Up to 9999 students, unlimited teachers' },
    pro_max: { students: '∞',  teachers: '∞', label: 'Unlimited students, teachers & staff — Annual only' },
  };

  ngOnInit() {
    this.loadData();
    this.loadRazorpayScript();
  }

  loadData() {
    this.api.get<any>('subscriptions/current').subscribe({
      next: (data) => { this.current.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>('subscriptions/limits').subscribe((data) => this.limits.set(data));
    this.api.get<any[]>('subscriptions').subscribe((data) => this.history.set(data));
  }

  get daysLeft(): number {
    const exp = this.current()?.expires_at;
    if (!exp) return 0;
    return Math.max(0, Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000));
  }

  get selectedPrice(): number {
    return PLAN_PRICES[this.selectedPlan]?.[this.selectedCycle] ?? 0;
  }

  statusBadge(s: string) {
    return { active: 'badge-green', trial: 'badge-blue', expired: 'badge-red', suspended: 'badge-red', grace_period: 'badge-yellow' }[s] ?? 'badge-gray';
  }

  startPayment() {
    this.paymentLoading.set(true);
    this.error.set('');
    const institutionId = this.auth.institutionId;

    this.http.post<any>(
      `${environment.apiUrl}/institutions/${institutionId}/billing/create-order`,
      { plan: this.selectedPlan, billing_cycle: this.selectedCycle },
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: (order) => {
        this.paymentLoading.set(false);
        this.openRazorpay(order);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create payment order');
        this.paymentLoading.set(false);
      },
    });
  }

  private openRazorpay(order: any) {
    const options = {
      key: order.key_id,
      amount: order.amount * 100,
      currency: order.currency,
      name: 'EduVilaasa',
      description: `${this.selectedPlan.toUpperCase()} Plan — ${this.selectedCycle}`,
      order_id: order.order_id,
      handler: (response: any) => this.verifyPayment(response),
      prefill: { email: this.auth.currentUser()?.email },
      theme: { color: '#7c3aed' },
      modal: { ondismiss: () => this.paymentLoading.set(false) },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  private verifyPayment(response: any) {
    this.paymentLoading.set(true);
    const institutionId = this.auth.institutionId;

    this.http.post<any>(
      `${environment.apiUrl}/institutions/${institutionId}/billing/verify-payment`,
      {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        plan: this.selectedPlan,
        billing_cycle: this.selectedCycle,
      },
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: () => {
        this.success.set('Payment successful! Your subscription has been activated.');
        this.showUpgrade.set(false);
        this.paymentLoading.set(false);
        this.loadData();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Payment verification failed');
        this.paymentLoading.set(false);
      },
    });
  }

  private loadRazorpayScript() {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
  }
}
