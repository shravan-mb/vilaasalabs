import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed: Role[] = route.data['roles'] ?? [];
  if (!auth.isLoggedIn) return router.parseUrl('/login');
  if (allowed.length === 0 || auth.hasRole(...allowed)) return true;
  auth.redirectByRole();
  return false;
};
