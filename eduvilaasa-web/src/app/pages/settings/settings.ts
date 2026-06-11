import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class SettingsPage implements OnInit {
  private http = inject(HttpClient);
  auth = inject(AuthService);

  // Profile form
  name = '';
  phone = '';
  profileSaving = signal(false);
  profileSuccess = signal('');
  profileError = signal('');

  // Password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordSaving = signal(false);
  passwordSuccess = signal('');
  passwordError = signal('');
  touched: Record<string, boolean> = {};

  // Institution profile form
  inst = {
    name: '', registration_number: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    logo_url: '', principal_name: '',
  };
  instSaving = signal(false);
  instSuccess = signal('');
  instError = signal('');

  get isAdmin() { return this.auth.hasRole('institution_admin'); }

  ngOnInit() {
    const user = this.auth.currentUser();
    this.name = user?.name ?? '';
    this.phone = user?.phone ?? '';
    if (this.isAdmin) this.loadInstitutionProfile();
  }

  loadInstitutionProfile() {
    const instId = this.auth.institutionId;
    if (!instId) return;
    this.http.get<any>(
      `${environment.apiUrl}/institutions/${instId}/profile`,
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: (data) => { this.inst = { ...this.inst, ...data }; },
      error: () => {},
    });
  }

  saveInstitutionProfile() {
    const instId = this.auth.institutionId;
    if (!instId) return;
    if (!this.inst.name.trim()) { this.instError.set('Institution name cannot be empty'); return; }
    this.instSaving.set(true);
    this.instError.set('');
    const { email: _email, ...payload } = this.inst;
    this.http.patch<any>(
      `${environment.apiUrl}/institutions/${instId}/profile`,
      payload,
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: () => {
        this.instSuccess.set('Institution profile updated successfully');
        this.instSaving.set(false);
        setTimeout(() => this.instSuccess.set(''), 3000);
      },
      error: (err) => {
        this.instError.set(err.error?.message || 'Failed to update institution profile');
        this.instSaving.set(false);
      },
    });
  }

  touch(f: string) { this.touched[f] = true; }

  get newPasswordInvalid(): boolean {
    return this.touched['newPassword'] && !PASSWORD_REGEX.test(this.newPassword);
  }
  get confirmInvalid(): boolean {
    return this.touched['confirm'] && this.newPassword !== this.confirmPassword;
  }

  saveProfile() {
    if (!this.name.trim()) { this.profileError.set('Name cannot be empty'); return; }
    this.profileSaving.set(true);
    this.profileError.set('');

    this.http.patch<any>(
      `${environment.apiUrl}/profile`,
      { name: this.name, phone: this.phone },
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: (updated) => {
        // Update stored user
        const user: import('../../core/models/user.model').AuthUser = { ...this.auth.currentUser()!, name: updated.name, phone: updated.phone };
        localStorage.setItem('ev_user', JSON.stringify(user));
        this.auth.currentUser.set(user);
        this.profileSuccess.set('Profile updated successfully');
        this.profileSaving.set(false);
        setTimeout(() => this.profileSuccess.set(''), 3000);
      },
      error: (err) => {
        this.profileError.set(err.error?.message || 'Failed to update profile');
        this.profileSaving.set(false);
      },
    });
  }

  changePassword() {
    ['currentPassword', 'newPassword', 'confirm'].forEach((f) => this.touch(f));
    if (!this.currentPassword) { this.passwordError.set('Current password is required'); return; }
    if (this.newPasswordInvalid) { this.passwordError.set('New password does not meet requirements'); return; }
    if (this.confirmInvalid)     { this.passwordError.set('Passwords do not match'); return; }

    this.passwordSaving.set(true);
    this.passwordError.set('');

    this.http.patch<any>(
      `${environment.apiUrl}/profile/password`,
      { current_password: this.currentPassword, new_password: this.newPassword },
      { headers: { Authorization: `Bearer ${this.auth.accessToken}` } }
    ).subscribe({
      next: () => {
        this.passwordSuccess.set('Password changed successfully');
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.touched = {};
        this.passwordSaving.set(false);
        setTimeout(() => this.passwordSuccess.set(''), 4000);
      },
      error: (err) => {
        this.passwordError.set(err.error?.message || 'Failed to change password');
        this.passwordSaving.set(false);
      },
    });
  }
}
