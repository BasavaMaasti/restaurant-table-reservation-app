import { createReducer, on } from '@ngrx/store';
import { RestaurantActions } from './restaurant.actions';
import { initialRestaurantState } from './restaurant.state';

export const restaurantReducer = createReducer(
  initialRestaurantState,
  on(RestaurantActions.loadRestaurants, RestaurantActions.loadRestaurant, RestaurantActions.checkAvailability, (state) => ({ ...state, loading: true, error: null })),
  on(RestaurantActions.loadRestaurantsSuccess, (state, { restaurants, total, page, pages }) => ({ ...state, restaurants, total, page, pages, loading: false })),
  on(RestaurantActions.loadRestaurantSuccess, (state, { restaurant }) => ({ ...state, selectedRestaurant: restaurant, loading: false })),
  on(RestaurantActions.checkAvailabilitySuccess, (state, { availability }) => ({ ...state, availability, loading: false })),
  on(RestaurantActions.loadRestaurantsFailure, RestaurantActions.loadRestaurantFailure, RestaurantActions.checkAvailabilityFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(RestaurantActions.clearSelected, (state) => ({ ...state, selectedRestaurant: null, availability: null })),
);
