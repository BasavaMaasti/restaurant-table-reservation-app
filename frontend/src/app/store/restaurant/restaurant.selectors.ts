import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RestaurantState } from './restaurant.state';

export const selectRestaurantState = createFeatureSelector<RestaurantState>('restaurants');
export const selectAllRestaurants = createSelector(selectRestaurantState, (s) => s.restaurants);
export const selectSelectedRestaurant = createSelector(selectRestaurantState, (s) => s.selectedRestaurant);
export const selectAvailability = createSelector(selectRestaurantState, (s) => s.availability);
export const selectRestaurantsLoading = createSelector(selectRestaurantState, (s) => s.loading);
export const selectRestaurantsTotal = createSelector(selectRestaurantState, (s) => s.total);
export const selectRestaurantsPages = createSelector(selectRestaurantState, (s) => s.pages);
