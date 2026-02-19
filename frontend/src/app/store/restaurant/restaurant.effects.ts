import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { RestaurantActions } from './restaurant.actions';
import { RestaurantService } from '../../core/services/restaurant.service';

@Injectable()
export class RestaurantEffects {
  constructor(private actions$: Actions, private restaurantService: RestaurantService) {}

  loadRestaurants$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RestaurantActions.loadRestaurants),
      switchMap(({ filters }) =>
        this.restaurantService.getAll(filters).pipe(
          map((res) => RestaurantActions.loadRestaurantsSuccess({ restaurants: res.data.restaurants, total: res.total, page: res.page, pages: res.pages })),
          catchError((err) => of(RestaurantActions.loadRestaurantsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadRestaurant$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RestaurantActions.loadRestaurant),
      switchMap(({ id }) =>
        this.restaurantService.getById(id).pipe(
          map((res) => RestaurantActions.loadRestaurantSuccess({ restaurant: res.data.restaurant })),
          catchError((err) => of(RestaurantActions.loadRestaurantFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  checkAvailability$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RestaurantActions.checkAvailability),
      switchMap(({ restaurantId, date, guestCount }) =>
        this.restaurantService.checkAvailability(restaurantId, date, guestCount).pipe(
          map((res) => RestaurantActions.checkAvailabilitySuccess({ availability: res.data })),
          catchError((err) => of(RestaurantActions.checkAvailabilityFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
