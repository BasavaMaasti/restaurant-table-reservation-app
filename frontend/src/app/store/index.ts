import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { AppState } from './app.state';
import { authReducer } from './auth/auth.reducer';
import { restaurantReducer } from './restaurant/restaurant.reducer';
import { reservationReducer } from './reservation/reservation.reducer';

export const reducers: ActionReducerMap<AppState> = {
  auth: authReducer,
  restaurants: restaurantReducer,
  reservations: reservationReducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
