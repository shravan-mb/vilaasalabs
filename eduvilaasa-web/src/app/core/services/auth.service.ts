import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginResponse, Role } from '../models/user.model';

const ACCESS_KEY = 'ev_access_token';
const REFRESH_KEY = 'ev_refresh_token';
const USER_KEY = 'ev_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<AuthUser | null>(this.loadUser());

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.accessToken && !!this.currentUser();
  }

  get institutionId(): string {
    return this.currentUser()?.institution_id ?? '';
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  login(identifier: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { identifier, password }).pipe(
      tap((res) => {
        localStorage.setItem(ACCESS_KEY, res.access_token);
        localStorage.setItem(REFRESH_KEY, res.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      }),
    );
  }

  refreshAccessToken() {
    return this.http
      .post<{ access_token: string }>(`${environment.apiUrl}/auth/refresh`, {
        refresh_token: this.refreshToken,
      })
      .pipe(
        tap((res) => {
          localStorage.setItem(ACCESS_KEY, res.access_token);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  redirectByRole(): void {
    const role = this.currentUser()?.role;
    const routes: Record<Role, string> = {
      institution_admin: '/admin/dashboard',
      institution_staff: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard',
    };
    this.router.navigate([role ? routes[role] : '/login']);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
