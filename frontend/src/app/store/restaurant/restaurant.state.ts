import { Restaurant, RestaurantAvailability } from '../../core/models/restaurant.model';

export interface RestaurantState {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  availability: RestaurantAvailability | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pages: number;
}

export const initialRestaurantState: RestaurantState = {
  restaurants: [],
  selectedRestaurant: null,
  availability: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pages: 1,
};
