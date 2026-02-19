import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, exhaustMap, tap, switchMap } from 'rxjs/operators';
import { AuthActions } from './auth.actions';
import { AuthService } from '../../core/services/auth.service';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
  ) {}

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      exhaustMap(({ email, password }) =>
        this.authService.login(email, password).pipe(
          map(({ user, accessToken }) => AuthActions.loginSuccess({ user, accessToken })),
          catchError((err) => of(AuthActions.loginFailure({ error: err.error?.message || 'Login failed' }))),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      tap(({ accessToken }) => {
        localStorage.setItem('accessToken', accessToken);
        this.router.navigate(['/restaurants']);
      }),
    ),
    { dispatch: false }
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.register),
      exhaustMap(({ name, email, password, phone }) =>
        this.authService.register({ name, email, password, phone }).pipe(
          map(({ user, accessToken }) => AuthActions.registerSuccess({ user, accessToken })),
          catchError((err) => of(AuthActions.registerFailure({ error: err.error?.message || 'Registration failed' }))),
        ),
      ),
    ),
  );

  registerSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerSuccess),
      tap(({ accessToken }) => {
        localStorage.setItem('accessToken', accessToken);
        this.router.navigate(['/restaurants']);
      }),
    ),
    { dispatch: false }
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      exhaustMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => of(AuthActions.logoutSuccess())),
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      tap(() => {
        localStorage.removeItem('accessToken');
        this.router.navigate(['/auth/login']);
      }),
    ),
    { dispatch: false }
  );

  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() =>
        this.authService.getMe().pipe(
          map((user) => AuthActions.loadCurrentUserSuccess({ user })),
          catchError(() => of(AuthActions.loadCurrentUserFailure())),
        ),
      ),
    ),
  );

  updateProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateProfile),
      exhaustMap(({ data }) =>
        this.authService.updateMe(data).pipe(
          map((user) => AuthActions.updateProfileSuccess({ user })),
          catchError((err) => of(AuthActions.updateProfileFailure({ error: err.error?.message || 'Update failed' }))),
        ),
      ),
    ),
  );
}
