import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { selectCurrentUser, selectIsLoggedIn, selectIsAdmin, selectIsSuperAdmin } from '../../../store/auth/auth.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule],
  template: `
    <mat-toolbar class="navbar">
      <div class="navbar-brand">
        <a routerLink="/" class="brand-link">
          <mat-icon>restaurant</mat-icon>
          <span class="brand-name">TableBook</span>
        </a>
      </div>

      <div class="nav-links">
        <a mat-button routerLink="/restaurants" routerLinkActive="active">
          <mat-icon>search</mat-icon> Restaurants
        </a>

        <ng-container *ngIf="isLoggedIn$ | async">
          <a mat-button routerLink="/reservations" routerLinkActive="active">
            <mat-icon>event_available</mat-icon> My Reservations
          </a>

          <ng-container *ngIf="isAdmin$ | async">
            <a mat-button routerLink="/admin/dashboard" routerLinkActive="active">
              <mat-icon>dashboard</mat-icon> Dashboard
            </a>
            <a mat-button routerLink="/admin/reservations" routerLinkActive="active">
              <mat-icon>event</mat-icon> Bookings
            </a>
            <a mat-button routerLink="/admin/tables" routerLinkActive="active">
              <mat-icon>table_restaurant</mat-icon> Tables
            </a>
            <a mat-button routerLink="/admin/users" routerLinkActive="active"
              *ngIf="isSuperAdmin$ | async"
              style="background: rgba(123,31,162,0.15); color: #e1bee7;">
              <mat-icon>manage_accounts</mat-icon> Users
            </a>
          </ng-container>
        </ng-container>
      </div>

      <div class="nav-actions">
        <ng-container *ngIf="(isLoggedIn$ | async); else guestButtons">
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <div class="avatar-circle" [class.super-admin]="isSuperAdmin$ | async">
              {{ (currentUser$ | async)?.name?.charAt(0)?.toUpperCase() }}
            </div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header" mat-menu-item disabled>
              <strong>{{ (currentUser$ | async)?.name }}</strong>
              <small>{{ (currentUser$ | async)?.email }}</small>
              <span class="menu-role" [class]="'role-' + (currentUser$ | async)?.role">
                {{ (currentUser$ | async)?.role | titlecase }}
              </span>
            </div>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon> My Profile
            </a>
            <a mat-menu-item routerLink="/reservations">
              <mat-icon>calendar_today</mat-icon> My Reservations
            </a>
            <mat-divider *ngIf="isAdmin$ | async"></mat-divider>
            <ng-container *ngIf="isAdmin$ | async">
              <a mat-menu-item routerLink="/admin/dashboard">
                <mat-icon>dashboard</mat-icon> Admin Dashboard
              </a>
              <a mat-menu-item routerLink="/admin/reservations">
                <mat-icon>event</mat-icon> Manage Bookings
              </a>
              <a mat-menu-item routerLink="/admin/tables">
                <mat-icon>table_restaurant</mat-icon> Manage Tables
              </a>
              <a mat-menu-item routerLink="/admin/users" *ngIf="isSuperAdmin$ | async" class="super-item">
                <mat-icon>manage_accounts</mat-icon> Manage Users
              </a>
            </ng-container>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()" class="logout-btn">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>
        </ng-container>

        <ng-template #guestButtons>
          <a mat-button routerLink="/auth/login">Login</a>
          <a mat-raised-button color="primary" routerLink="/auth/register">Sign Up</a>
        </ng-template>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: #1B4332;
      color: white;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      justify-content: space-between;
      height: 64px;
    }
    .navbar-brand { display: flex; align-items: center; flex-shrink: 0; }
    .brand-link { display: flex; align-items: center; gap: 8px; text-decoration: none; color: white; }
    .brand-name { font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px; }
    .nav-links { display: flex; gap: 2px; overflow-x: auto; }
    .nav-links a { color: rgba(255,255,255,0.85); font-size: 0.88rem; padding: 0 10px; flex-shrink: 0; }
    .nav-links a.active, .nav-links a:hover { color: white; background: rgba(255,255,255,0.12) !important; border-radius: 4px; }
    .nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .avatar-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: #40916C; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
    }
    .avatar-circle.super-admin { background: #7b1fa2; }
    .user-menu-header { display: flex; flex-direction: column; padding: 12px 16px !important; cursor: default; }
    .user-menu-header strong { font-size: 0.95rem; }
    .user-menu-header small { color: #666; font-size: 0.8rem; margin-top: 2px; }
    .menu-role { font-size: 0.75rem; font-weight: 700; margin-top: 4px; padding: 2px 8px; border-radius: 10px; width: fit-content; }
    .role-customer { background: #e8f5e9; color: #2e7d32; }
    .role-admin { background: #e3f2fd; color: #1565c0; }
    .role-super_admin { background: #f3e5f5; color: #7b1fa2; }
    .logout-btn { color: #c62828 !important; }
    .super-item { color: #7b1fa2; }
    .super-item mat-icon { color: #7b1fa2; }

    @media (max-width: 1100px) {
      .nav-links a span { display: none; }
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
    }
  `],
})
export class NavbarComponent {
  currentUser$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;
  isSuperAdmin$: Observable<boolean>;

  constructor(private store: Store) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.isLoggedIn$ = this.store.select(selectIsLoggedIn);
    this.isAdmin$ = this.store.select(selectIsAdmin);
    this.isSuperAdmin$ = this.store.select(selectIsSuperAdmin);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
