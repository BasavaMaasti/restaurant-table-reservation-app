import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take, filter } from 'rxjs/operators';
import { selectIsLoggedIn } from '../../store/auth/auth.selectors';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectIsLoggedIn).pipe(
    take(1),
    map((isLoggedIn) => {
      if (isLoggedIn) return true;
      const token = localStorage.getItem('accessToken');
      if (token) return true;
      router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }),
  );
};
