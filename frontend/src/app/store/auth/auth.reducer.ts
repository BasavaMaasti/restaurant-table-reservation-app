import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,

  on(AuthActions.login, AuthActions.register, (state) => ({
    ...state, loading: true, error: null,
  })),

  on(AuthActions.loginSuccess, AuthActions.registerSuccess, (state, { user, accessToken }) => ({
    ...state, user, accessToken, isLoggedIn: true, loading: false, error: null,
  })),

  on(AuthActions.loginFailure, AuthActions.registerFailure, (state, { error }) => ({
    ...state, loading: false, error,
  })),

  on(AuthActions.logoutSuccess, () => initialAuthState),

  on(AuthActions.loadCurrentUserSuccess, (state, { user }) => ({
    ...state, user, isLoggedIn: true,
  })),

  on(AuthActions.loadCurrentUserFailure, (state) => ({
    ...state, user: null, isLoggedIn: false,
  })),

  on(AuthActions.updateProfileSuccess, (state, { user }) => ({
    ...state, user,
  })),

  on(AuthActions.refreshTokenSuccess, (state, { accessToken }) => ({
    ...state, accessToken,
  })),

  on(AuthActions.clearError, (state) => ({ ...state, error: null })),
);
