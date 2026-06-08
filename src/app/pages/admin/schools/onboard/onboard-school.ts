import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../../core/services/admin-api.service';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
const SUBDOMAIN_REGEX = /^[a-z0-9-]{3,}$/;

@Component({
  selector: 'app-onboard-school',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './onboard-school.html',
  styleUrl: './onboard-school.scss'
})
export class OnboardSchool {
  form = {
    name: '', type: 'school', subdomain: '', email: '',
    phone: '', city: '', state: '', address: '', pincode: '',
    principal_name: '', registration_number: '', admin_name: '', admin_password: ''
  };

  // tracks which fields the user has interacted with
  touched: Record<string, boolean> = {};

  institutionTypes = ['school', 'college', 'sports_academy', 'coaching_center', 'other'];
  loading = signal(false);
  success = signal('');
  error = signal('');

  constructor(private api: AdminApiService, private router: Router) {}

  touch(field: string) {
    this.touched[field] = true;
  }

  isInvalid(field: string): boolean {
    if (!this.touched[field]) return false;
    switch (field) {
      case 'name':           return !this.form.name.trim();
      case 'subdomain':      return !SUBDOMAIN_REGEX.test(this.form.subdomain);
      case 'email':          return !this.form.email.includes('@');
      case 'admin_name':     return !this.form.admin_name.trim();
      case 'admin_password': return !PASSWORD_REGEX.test(this.form.admin_password);
      default:               return false;
    }
  }

  passwordHint(): string {
    if (!this.form.admin_password) return '';
    const p = this.form.admin_password;
    const missing: string[] = [];
    if (p.length < 8)          missing.push('8+ characters');
    if (!/[A-Z]/.test(p))      missing.push('uppercase letter');
    if (!/[a-z]/.test(p))      missing.push('lowercase letter');
    if (!/\d/.test(p))         missing.push('number');
    if (!/[@$!%*?&]/.test(p))  missing.push('special character (@$!%*?&)');
    return missing.length ? `Missing: ${missing.join(', ')}` : '';
  }

  onSubdomainInput() {
    this.form.subdomain = this.form.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  onSubmit() {
    // touch all required fields to trigger red borders before submit
    ['name', 'subdomain', 'email', 'admin_name', 'admin_password'].forEach(f => this.touch(f));

    if (['name', 'subdomain', 'email', 'admin_name', 'admin_password'].some(f => this.isInvalid(f))) {
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    this.api.onboardInstitution(this.form).subscribe({
      next: () => {
        this.success.set(`${this.form.name} has been onboarded successfully with a 30-day trial!`);
        this.loading.set(false);
        setTimeout(() => this.router.navigate(['/admin/schools']), 2000);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error.set(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to onboard institution'));
        this.loading.set(false);
      }
    });
  }
}
