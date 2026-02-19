import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { selectCurrentUser, selectIsLoggedIn, selectIsAdmin } from '../../../store/auth/auth.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule,MatDividerModule],
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

          <a mat-button routerLink="/admin" routerLinkActive="active" *ngIf="isAdmin$ | async">
            <mat-icon>admin_panel_settings</mat-icon> Admin
          </a>
        </ng-container>
      </div>

      <div class="nav-actions">
        <ng-container *ngIf="(isLoggedIn$ | async); else guestButtons">
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <div class="avatar-circle">{{ (currentUser$ | async)?.name?.charAt(0)?.toUpperCase() }}</div>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-menu-header" mat-menu-item disabled>
              <strong>{{ (currentUser$ | async)?.name }}</strong>
              <small>{{ (currentUser$ | async)?.email }}</small>
            </div>
            <mat-divider></mat-divider>
            <a mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon> Profile
            </a>
            <a mat-menu-item routerLink="/reservations">
              <mat-icon>calendar_today</mat-icon> My Reservations
            </a>
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
    }
    .navbar-brand { display: flex; align-items: center; }
    .brand-link { display: flex; align-items: center; gap: 8px; text-decoration: none; color: white; }
    .brand-name { font-size: 1.4rem; font-weight: 700; letter-spacing: 0.5px; }
    .nav-links { display: flex; gap: 4px; }
    .nav-links a { color: rgba(255,255,255,0.85); }
    .nav-links a.active, .nav-links a:hover { color: white; background: rgba(255,255,255,0.1); }
    .nav-actions { display: flex; align-items: center; gap: 8px; }
    .avatar-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: #40916C; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.9rem;
    }
    .user-menu-header { display: flex; flex-direction: column; padding: 12px 16px; }
    .user-menu-header strong { font-size: 0.95rem; }
    .user-menu-header small { color: #666; font-size: 0.8rem; }
    .logout-btn { color: #c62828; }
    mat-divider { margin: 4px 0; }

    @media (max-width: 768px) {
      .nav-links a span { display: none; }
      .brand-name { font-size: 1.1rem; }
    }
  `],
})
export class NavbarComponent {
  currentUser$: Observable<User | null>;
  isLoggedIn$: Observable<boolean>;
  isAdmin$: Observable<boolean>;

  constructor(private store: Store) {
    this.currentUser$ = this.store.select(selectCurrentUser);
    this.isLoggedIn$ = this.store.select(selectIsLoggedIn);
    this.isAdmin$ = this.store.select(selectIsAdmin);
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
