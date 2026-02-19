import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { AuthActions } from '../../store/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('accessToken');

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        const authService = inject(AuthService);
        const store = inject(Store);

        return authService.refreshToken().pipe(
          switchMap(({ accessToken }) => {
            localStorage.setItem('accessToken', accessToken);
            store.dispatch(AuthActions.refreshTokenSuccess({ accessToken }));
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
            return next(retried);
          }),
          catchError((refreshErr) => {
            store.dispatch(AuthActions.logout());
            return throwError(() => refreshErr);
          }),
        );
      }
      return throwError(() => err);
    }),
  );
};
