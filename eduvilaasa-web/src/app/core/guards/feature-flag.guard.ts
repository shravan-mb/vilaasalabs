import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, race, take, timer } from 'rxjs';
import { InstitutionSettingsService } from '../services/institution-settings.service';

export const featureFlagGuard: CanActivateFn = (route) => {
  const settings = inject(InstitutionSettingsService);
  const router   = inject(Router);
  const flagKey  = route.data['flagKey'] as string;

  const check = () => {
    if (settings.isEnabled(flagKey)) return true;
    return router.createUrlTree(['/admin/dashboard']);
  };

  // Already loaded — decide immediately
  if (settings.loaded()) return check();

  // Trigger load ourselves in case Layout hasn't done it yet (direct URL entry)
  settings.load();

  // Wait for flags, but never hang — fall back to allowing after 3s
  return race(
    toObservable(settings.loaded).pipe(filter(v => v), take(1)),
    timer(3000).pipe(map(() => true)),
  ).pipe(
    take(1),
    map(() => check()),
  );
};
