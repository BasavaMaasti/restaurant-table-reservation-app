import { User } from '../../core/models/user.model';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  isLoggedIn: false,
};
