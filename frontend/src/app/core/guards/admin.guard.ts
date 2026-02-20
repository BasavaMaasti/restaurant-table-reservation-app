import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take } from 'rxjs/operators';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  const token = localStorage.getItem('accessToken');
  if (!token) {
    router.navigate(['/restaurants']);
    return false;
  }

  // Wait until user is loaded from API (not null) before checking role
  return store.select(selectCurrentUser).pipe(
    filter((user) => user !== null),
    take(1),
    map((user) => {
      if (user?.role === 'admin' || user?.role === 'super_admin') return true;
      router.navigate(['/restaurants']);
      return false;
    }),
  );
};
