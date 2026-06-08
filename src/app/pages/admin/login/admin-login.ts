import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss'
})
export class AdminLogin {
  identifier = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPwd = signal(false);

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn() && this.auth.isInternalAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  onSubmit() {
    if (!this.identifier || !this.password) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.identifier, this.password).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      }
    });
  }
}
