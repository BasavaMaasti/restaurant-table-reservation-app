import { AuthState } from './auth/auth.state';
import { RestaurantState } from './restaurant/restaurant.state';
import { ReservationState } from './reservation/reservation.state';

export interface AppState {
  auth: AuthState;
  restaurants: RestaurantState;
  reservations: ReservationState;
}
