import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { Observable } from 'rxjs';
import { User } from '../../../core/models/user.model';
import { selectCurrentUser, selectIsLoggedIn, selectIsAdmin, selectIsSuperAdmin } from '../../../store/auth/auth.selectors';
import { AuthActions } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, MatBadgeModule],
  template: `
    <nav class="navbar">
      <div class="navbar-inner">

        <!-- Brand -->
        <a routerLink="/" class="brand">
          <div class="brand-icon">🍽️</div>
          <span class="brand-name">TableBook</span>
        </a>

        <!-- Center Nav (public links) -->
        <div class="center-nav">
          <a routerLink="/restaurants" routerLinkActive="nav-active" class="nav-link">
            <mat-icon>search</mat-icon> Find Restaurants
          </a>
          <ng-container *ngIf="isLoggedIn$ | async">
            <a routerLink="/reservations" routerLinkActive="nav-active" class="nav-link">
              <mat-icon>calendar_today</mat-icon> My Bookings
            </a>
          </ng-container>
        </div>

        <!-- Right Side -->
        <div class="right-nav">

          <!-- Admin Menu Button (only for admin/super admin) -->
          <ng-container *ngIf="isAdmin$ | async">
            <button class="admin-pill" [matMenuTriggerFor]="adminMenu">
              <mat-icon>admin_panel_settings</mat-icon>
              Admin Panel
              <mat-icon class="chevron">expand_more</mat-icon>
            </button>

            <mat-menu #adminMenu="matMenu" class="admin-dropdown">
              <a mat-menu-item routerLink="/admin/dashboard">
                <mat-icon>dashboard</mat-icon>
                <span>Dashboard</span>
              </a>
              <a mat-menu-item routerLink="/admin/restaurants">
                <mat-icon>store</mat-icon>
                <span>Restaurants</span>
              </a>
              <a mat-menu-item routerLink="/admin/reservations">
                <mat-icon>event_note</mat-icon>
                <span>Bookings</span>
              </a>
              <a mat-menu-item routerLink="/admin/tables">
                <mat-icon>table_restaurant</mat-icon>
                <span>Tables</span>
              </a>
              <ng-container *ngIf="isSuperAdmin$ | async">
                <mat-divider></mat-divider>
                <a mat-menu-item routerLink="/admin/users" class="super-item">
                  <mat-icon>manage_accounts</mat-icon>
                  <span>User Management</span>
                </a>
              </ng-container>
            </mat-menu>
          </ng-container>

          <!-- Guest buttons -->
          <ng-container *ngIf="!(isLoggedIn$ | async)">
            <a routerLink="/auth/login" class="nav-link">Sign In</a>
            <a routerLink="/auth/register" class="btn-signup">Sign Up</a>
          </ng-container>

          <!-- User Avatar Menu -->
          <ng-container *ngIf="isLoggedIn$ | async">
            <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
              <div class="avatar" [class.avatar-admin]="isAdmin$ | async" [class.avatar-super]="isSuperAdmin$ | async">
                {{ (currentUser$ | async)?.name?.charAt(0)?.toUpperCase() }}
              </div>
              <div class="avatar-info">
                <span class="avatar-name">{{ (currentUser$ | async)?.name?.split(' ')?.[0] }}</span>
                <span class="avatar-role">{{ getRoleLabel((currentUser$ | async)?.role) }}</span>
              </div>
              <mat-icon class="chevron-small">expand_more</mat-icon>
            </button>

            <mat-menu #userMenu="matMenu">
              <div class="menu-user-header" mat-menu-item disabled>
                <div class="menu-avatar" [class.avatar-admin]="isAdmin$ | async" [class.avatar-super]="isSuperAdmin$ | async">
                  {{ (currentUser$ | async)?.name?.charAt(0)?.toUpperCase() }}
                </div>
                <div>
                  <strong>{{ (currentUser$ | async)?.name }}</strong>
                  <small>{{ (currentUser$ | async)?.email }}</small>
                </div>
              </div>
              <mat-divider></mat-divider>
              <a mat-menu-item routerLink="/profile">
                <mat-icon>person_outline</mat-icon> My Profile
              </a>
              <a mat-menu-item routerLink="/reservations">
                <mat-icon>calendar_today</mat-icon> My Bookings
              </a>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()" class="logout-item">
                <mat-icon>logout</mat-icon> Sign Out
              </button>
            </mat-menu>
          </ng-container>

        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: #1B4332;
      height: 64px;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 20px rgba(0,0,0,0.25);
    }
    .navbar-inner {
      max-width: 1400px;
      margin: 0 auto;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 24px;
    }

    /* Brand */
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .brand-icon { font-size: 1.6rem; line-height: 1; }
    .brand-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: white;
      letter-spacing: -0.3px;
    }

    /* Center Nav */
    .center-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      flex: 1;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.15s;
    }
    .nav-link mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .nav-link:hover { color: white; background: rgba(255,255,255,0.1); text-decoration: none; }
    .nav-active { color: white !important; background: rgba(255,255,255,0.15) !important; }

    /* Right Nav */
    .right-nav {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    /* Admin Pill */
    .admin-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 7px 14px;
      border-radius: 20px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .admin-pill:hover { background: rgba(255,255,255,0.2); }
    .admin-pill mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .chevron { font-size: 18px !important; width: 18px !important; height: 18px !important; }

    /* Signup button */
    .btn-signup {
      background: white;
      color: #1B4332;
      padding: 8px 18px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
      transition: all 0.15s;
    }
    .btn-signup:hover { background: #f0fdf4; transform: translateY(-1px); text-decoration: none; }

    /* Avatar Button */
    .avatar-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 24px;
      padding: 5px 12px 5px 5px;
      cursor: pointer;
      color: white;
      transition: all 0.15s;
    }
    .avatar-btn:hover { background: rgba(255,255,255,0.16); }
    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #40916C;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.95rem;
      flex-shrink: 0;
    }
    .avatar-admin { background: #1565c0; }
    .avatar-super { background: #7b1fa2; }
    .avatar-info { display: flex; flex-direction: column; line-height: 1.2; }
    .avatar-name { font-size: 0.85rem; font-weight: 600; color: white; }
    .avatar-role { font-size: 0.7rem; color: rgba(255,255,255,0.6); }
    .chevron-small { font-size: 16px !important; width: 16px !important; height: 16px !important; color: rgba(255,255,255,0.6); }

    /* Dropdown user header */
    .menu-user-header {
      display: flex !important;
      align-items: center;
      gap: 12px;
      padding: 12px 16px !important;
    }
    .menu-user-header strong { display: block; font-size: 0.9rem; }
    .menu-user-header small { display: block; color: #888; font-size: 0.78rem; }
    .menu-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #40916C;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }
    .logout-item { color: #c62828 !important; }
    .logout-item mat-icon { color: #c62828 !important; }
    .super-item mat-icon { color: #7b1fa2 !important; }
    .super-item span { color: #7b1fa2 !important; }

    @media (max-width: 900px) {
      .avatar-info { display: none; }
      .admin-pill span { display: none; }
    }
    @media (max-width: 640px) {
      .center-nav .nav-link span { display: none; }
      .brand-name { font-size: 1.1rem; }
    }
  `]
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

  getRoleLabel(role?: string): string {
    const labels: Record<string, string> = {
      customer: 'Customer',
      admin: 'Admin',
      super_admin: 'Super Admin',
    };
    return role ? labels[role] || '' : '';
  }

  logout() {
    this.store.dispatch(AuthActions.logout());
  }
}
