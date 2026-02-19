import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, filter, take } from 'rxjs/operators';
import { selectCurrentUser } from '../../store/auth/auth.selectors';

export const superAdminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  const token = localStorage.getItem('accessToken');
  if (!token) {
    router.navigate(['/restaurants']);
    return false;
  }

  return store.select(selectCurrentUser).pipe(
    filter((user) => user !== null),
    take(1),
    map((user) => {
      if (user?.role === 'super_admin') return true;
      router.navigate(['/admin/dashboard']);
      return false;
    }),
  );
};
