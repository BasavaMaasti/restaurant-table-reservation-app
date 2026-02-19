import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { Reservation } from '../../core/models/reservation.model';

export const ReservationActions = createActionGroup({
  source: 'Reservation',
  events: {
    'Load My Reservations': props<{ filters?: any }>(),
    'Load My Reservations Success': props<{ reservations: Reservation[]; total: number; page: number; pages: number }>(),
    'Load My Reservations Failure': props<{ error: string }>(),

    'Load Reservation': props<{ id: string }>(),
    'Load Reservation Success': props<{ reservation: Reservation }>(),
    'Load Reservation Failure': props<{ error: string }>(),

    'Create Reservation': props<{ data: any }>(),
    'Create Reservation Success': props<{ reservation: Reservation }>(),
    'Create Reservation Failure': props<{ error: string }>(),

    'Cancel Reservation': props<{ id: string; reason?: string }>(),
    'Cancel Reservation Success': props<{ reservation: Reservation }>(),
    'Cancel Reservation Failure': props<{ error: string }>(),

    'Clear Selected': emptyProps(),
    'Clear Error': emptyProps(),
  },
});
