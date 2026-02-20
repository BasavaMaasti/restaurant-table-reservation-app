import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'restaurants', pathMatch: 'full' },

  // Auth
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
      },
    ],
  },

  // Restaurants (public)
  {
    path: 'restaurants',
    loadComponent: () => import('./features/restaurants/list/restaurant-list.component').then(m => m.RestaurantListComponent),
  },
  {
    path: 'restaurants/:id',
    loadComponent: () => import('./features/restaurants/detail/restaurant-detail.component').then(m => m.RestaurantDetailComponent),
  },

  // Reservations (protected)
  {
    path: 'reservations',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/reservations/list/reservation-list.component').then(m => m.ReservationListComponent),
      },
      {
        path: 'create',
        loadComponent: () => import('./features/reservations/create/reservation-create.component').then(m => m.ReservationCreateComponent),
      },
      {
        path: ':id',
        loadComponent: () => import('./features/reservations/detail/reservation-detail.component').then(m => m.ReservationDetailComponent),
      },
    ],
  },

  // Profile (protected)
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },

  // Admin (protected + role)
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/admin/reservations/admin-reservations.component').then(m => m.AdminReservationsComponent),
      },
      {
        path: 'tables',
        loadComponent: () => import('./features/admin/tables/admin-tables.component').then(m => m.AdminTablesComponent),
      },
      {
        path: 'restaurants',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/restaurants/admin-restaurants.component').then(m => m.AdminRestaurantsComponent),
      },
      {
        path: 'users',
        canActivate: [superAdminGuard],
        loadComponent: () => import('./features/admin/users/admin-users.component').then(m => m.AdminUsersComponent),
      },
    ],
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
