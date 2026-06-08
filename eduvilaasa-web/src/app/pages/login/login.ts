import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  identifier = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPwd = signal(false);

  ngOnInit() {
    if (this.auth.isLoggedIn) this.auth.redirectByRole();
  }

  onSubmit() {
    if (!this.identifier || !this.password) {
      this.error.set('Username and password are required');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.identifier, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Invalid credentials');
        this.loading.set(false);
      },
    });
  }
}
