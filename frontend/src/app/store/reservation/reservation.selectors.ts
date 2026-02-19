import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ReservationState } from './reservation.state';

export const selectReservationState = createFeatureSelector<ReservationState>('reservations');
export const selectAllReservations = createSelector(selectReservationState, (s) => s.reservations);
export const selectSelectedReservation = createSelector(selectReservationState, (s) => s.selectedReservation);
export const selectReservationsLoading = createSelector(selectReservationState, (s) => s.loading);
export const selectReservationCreating = createSelector(selectReservationState, (s) => s.creating);
export const selectReservationError = createSelector(selectReservationState, (s) => s.error);
export const selectReservationsTotal = createSelector(selectReservationState, (s) => s.total);
