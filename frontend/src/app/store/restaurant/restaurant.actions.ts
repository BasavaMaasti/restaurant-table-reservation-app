import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { Restaurant, RestaurantAvailability } from '../../core/models/restaurant.model';

export const RestaurantActions = createActionGroup({
  source: 'Restaurant',
  events: {
    'Load Restaurants': props<{ filters?: any }>(),
    'Load Restaurants Success': props<{ restaurants: Restaurant[]; total: number; page: number; pages: number }>(),
    'Load Restaurants Failure': props<{ error: string }>(),

    'Load Restaurant': props<{ id: string }>(),
    'Load Restaurant Success': props<{ restaurant: Restaurant }>(),
    'Load Restaurant Failure': props<{ error: string }>(),

    'Check Availability': props<{ restaurantId: string; date: string; guestCount: number }>(),
    'Check Availability Success': props<{ availability: RestaurantAvailability }>(),
    'Check Availability Failure': props<{ error: string }>(),

    'Clear Selected': emptyProps(),
  },
});
