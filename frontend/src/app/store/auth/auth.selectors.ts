import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectCurrentUser = createSelector(selectAuthState, (s) => s.user);
export const selectIsLoggedIn = createSelector(selectAuthState, (s) => s.isLoggedIn);
export const selectAuthLoading = createSelector(selectAuthState, (s) => s.loading);
export const selectAuthError = createSelector(selectAuthState, (s) => s.error);
export const selectAccessToken = createSelector(selectAuthState, (s) => s.accessToken);
export const selectUserRole = createSelector(selectAuthState, (s) => s.user?.role);
export const selectIsAdmin = createSelector(selectUserRole, (role) => role === 'admin' || role === 'super_admin');
export const selectIsSuperAdmin = createSelector(selectUserRole, (role) => role === 'super_admin');
