import { createReducer, on } from '@ngrx/store';
import { ReservationActions } from './reservation.actions';
import { initialReservationState } from './reservation.state';

export const reservationReducer = createReducer(
  initialReservationState,
  on(ReservationActions.loadMyReservations, ReservationActions.loadReservation, (s) => ({ ...s, loading: true, error: null })),
  on(ReservationActions.createReservation, (s) => ({ ...s, creating: true, error: null })),
  on(ReservationActions.loadMyReservationsSuccess, (s, { reservations, total, page, pages }) => ({ ...s, reservations, total, page, pages, loading: false })),
  on(ReservationActions.loadReservationSuccess, (s, { reservation }) => ({ ...s, selectedReservation: reservation, loading: false })),
  on(ReservationActions.createReservationSuccess, (s, { reservation }) => ({ ...s, reservations: [reservation, ...s.reservations], selectedReservation: reservation, creating: false })),
  on(ReservationActions.cancelReservationSuccess, (s, { reservation }) => ({
    ...s,
    reservations: s.reservations.map(r => r._id === reservation._id ? reservation : r),
    selectedReservation: s.selectedReservation?._id === reservation._id ? reservation : s.selectedReservation,
  })),
  on(ReservationActions.loadMyReservationsFailure, ReservationActions.loadReservationFailure, ReservationActions.cancelReservationFailure, (s, { error }) => ({ ...s, loading: false, error })),
  on(ReservationActions.createReservationFailure, (s, { error }) => ({ ...s, creating: false, error })),
  on(ReservationActions.clearSelected, (s) => ({ ...s, selectedReservation: null })),
  on(ReservationActions.clearError, (s) => ({ ...s, error: null })),
);
