import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  institution_id: string | null;
}

const API = environment.apiUrl;
const TOKEN_KEY = 'vl_access_token';
const REFRESH_KEY = 'vl_refresh_token';
const USER_KEY = 'vl_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AdminUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(identifier: string, password: string) {
    return this.http.post<{ access_token: string; refresh_token: string; user: AdminUser }>(
      `${API}/auth/login`, { identifier, password }
    ).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.access_token);
        localStorage.setItem(REFRESH_KEY, res.refresh_token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.currentUser.set(res.user);
      })
    );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/admin/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isInternalAdmin(): boolean {
    const user = this.currentUser();
    return !!user && (user.role === 'vilaasalabs_super_admin' || user.role === 'vilaasalabs_dev');
  }

  private loadUser(): AdminUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
