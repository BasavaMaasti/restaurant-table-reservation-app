import { Reservation } from '../../core/models/reservation.model';

export interface ReservationState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  total: number;
  page: number;
  pages: number;
}

export const initialReservationState: ReservationState = {
  reservations: [],
  selectedReservation: null,
  loading: false,
  creating: false,
  error: null,
  total: 0,
  page: 1,
  pages: 1,
};
