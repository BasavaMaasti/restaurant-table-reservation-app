import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError, switchMap, tap, exhaustMap } from 'rxjs/operators';
import { ReservationActions } from './reservation.actions';
import { ReservationService } from '../../core/services/reservation.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ReservationEffects {
  constructor(
    private actions$: Actions,
    private reservationService: ReservationService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  loadMyReservations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.loadMyReservations),
      switchMap(({ filters }) =>
        this.reservationService.getMyReservations(filters).pipe(
          map((res) => ReservationActions.loadMyReservationsSuccess({ reservations: res.data.reservations, total: res.total, page: res.page, pages: res.pages })),
          catchError((err) => of(ReservationActions.loadMyReservationsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadReservation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.loadReservation),
      switchMap(({ id }) =>
        this.reservationService.getById(id).pipe(
          map((res) => ReservationActions.loadReservationSuccess({ reservation: res.data.reservation })),
          catchError((err) => of(ReservationActions.loadReservationFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createReservation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.createReservation),
      exhaustMap(({ data }) =>
        this.reservationService.create(data).pipe(
          map((res) => ReservationActions.createReservationSuccess({ reservation: res.data.reservation })),
          catchError((err) => of(ReservationActions.createReservationFailure({ error: err.error?.message || 'Booking failed' }))),
        ),
      ),
    ),
  );

  createReservationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.createReservationSuccess),
      tap(({ reservation }) => {
        this.snackBar.open('Reservation confirmed! Check your email.', 'Close', { duration: 5000, panelClass: 'snack-success' });
        this.router.navigate(['/reservations', reservation._id]);
      }),
    ),
    { dispatch: false }
  );

  cancelReservation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.cancelReservation),
      exhaustMap(({ id, reason }) =>
        this.reservationService.cancel(id, reason).pipe(
          map((res) => ReservationActions.cancelReservationSuccess({ reservation: res.data.reservation })),
          catchError((err) => of(ReservationActions.cancelReservationFailure({ error: err.error?.message || 'Cancellation failed' }))),
        ),
      ),
    ),
  );

  cancelSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ReservationActions.cancelReservationSuccess),
      tap(() => this.snackBar.open('Reservation cancelled.', 'Close', { duration: 3000 })),
    ),
    { dispatch: false }
  );
}
