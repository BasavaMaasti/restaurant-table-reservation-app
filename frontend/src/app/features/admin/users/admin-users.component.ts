import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatPaginatorModule,
    MatSlideToggleModule, MatTooltipModule, MatSnackBarModule,
    MatChipsModule, MatBadgeModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1><mat-icon>manage_accounts</mat-icon> User Management</h1>
          <p class="subtitle">Super Admin only — manage all user accounts and roles</p>
        </div>
        <a mat-stroked-button routerLink="/admin"><mat-icon>arrow_back</mat-icon> Dashboard</a>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" *ngIf="!loading">
        <div class="stat-chip" *ngFor="let s of roleStats">
          <span class="stat-num">{{ s.count }}</span>
          <span class="stat-label">{{ s.label }}</span>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="outline">
            <mat-label>Filter by Role</mat-label>
            <mat-select formControlName="role" (selectionChange)="loadUsers()">
              <mat-option value="">All Roles</mat-option>
              <mat-option value="customer">Customer</mat-option>
              <mat-option value="admin">Admin</mat-option>
              <mat-option value="super_admin">Super Admin</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filter by Status</mat-label>
            <mat-select formControlName="isActive" (selectionChange)="loadUsers()">
              <mat-option value="">All Status</mat-option>
              <mat-option value="true">Active</mat-option>
              <mat-option value="false">Deactivated</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-stroked-button (click)="filterForm.reset({ role: '', isActive: '' }); loadUsers()">
            <mat-icon>clear</mat-icon> Clear Filters
          </button>
        </form>
      </mat-card>

      <!-- Users Table -->
      <mat-card class="table-card">
        <div class="loading-center" *ngIf="loading"><mat-spinner diameter="48"></mat-spinner></div>

        <table mat-table [dataSource]="users" *ngIf="!loading" class="users-table">

          <!-- Avatar + Name -->
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <div class="avatar" [class]="'avatar-' + u.role">
                  {{ u.name?.charAt(0)?.toUpperCase() }}
                </div>
                <div class="user-info">
                  <strong>{{ u.name }}</strong>
                  <small>{{ u.email }}</small>
                  <small *ngIf="u.phone" class="phone">{{ u.phone }}</small>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Role -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <span class="role-badge" [class]="'role-' + u.role">
                <mat-icon>{{ getRoleIcon(u.role) }}</mat-icon>
                {{ u.role | titlecase }}
              </span>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span class="status-badge" [class]="u.isActive ? 'status-active' : 'status-inactive'">
                <mat-icon>{{ u.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
                {{ u.isActive ? 'Active' : 'Deactivated' }}
              </span>
            </td>
          </ng-container>

          <!-- Joined -->
          <ng-container matColumnDef="joined">
            <th mat-header-cell *matHeaderCellDef>Joined</th>
            <td mat-cell *matCellDef="let u">
              <span>{{ u.createdAt | date:'MMM d, y' }}</span>
            </td>
          </ng-container>

          <!-- Last Login -->
          <ng-container matColumnDef="lastLogin">
            <th mat-header-cell *matHeaderCellDef>Last Login</th>
            <td mat-cell *matCellDef="let u">
              <span *ngIf="u.lastLogin">{{ u.lastLogin | date:'MMM d, y' }}</span>
              <span *ngIf="!u.lastLogin" class="never">Never</span>
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let u">
              <div class="action-group">

                <!-- Change Role -->
                <mat-form-field appearance="outline" class="role-select">
                  <mat-select [value]="u.role" (selectionChange)="changeRole(u, $event.value)"
                    [disabled]="u.role === 'super_admin' && !isSelf(u)">
                    <mat-option value="customer">
                      <mat-icon>person</mat-icon> Customer
                    </mat-option>
                    <mat-option value="admin">
                      <mat-icon>admin_panel_settings</mat-icon> Admin
                    </mat-option>
                    <mat-option value="super_admin">
                      <mat-icon>shield</mat-icon> Super Admin
                    </mat-option>
                  </mat-select>
                </mat-form-field>

                <!-- Activate / Deactivate -->
                <button mat-icon-button
                  [color]="u.isActive ? 'warn' : 'primary'"
                  [matTooltip]="u.isActive ? 'Deactivate Account' : 'Activate Account'"
                  (click)="toggleActive(u)">
                  <mat-icon>{{ u.isActive ? 'block' : 'check_circle' }}</mat-icon>
                </button>

              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"
            [class.inactive-row]="!row.isActive"></tr>
        </table>

        <div class="empty-state" *ngIf="!loading && users.length === 0">
          <mat-icon>people_outline</mat-icon>
          <p>No users found matching the current filters.</p>
        </div>

        <mat-paginator
          [length]="total"
          [pageSize]="20"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
          showFirstLastButtons>
        </mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; color: #1B4332; margin: 0 0 4px; font-size: 1.7rem; }
    .subtitle { color: #666; margin: 0; font-size: 0.9rem; }

    .stats-row { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .stat-chip { background: white; border: 1px solid #e0e0e0; border-radius: 12px; padding: 12px 24px; display: flex; flex-direction: column; align-items: center; min-width: 120px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .stat-num { font-size: 1.8rem; font-weight: 700; color: #1B4332; line-height: 1; }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 4px; }

    .filter-card { border-radius: 12px; margin-bottom: 20px; }
    .filter-form { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; padding: 8px 0; }
    .filter-form mat-form-field { width: 200px; }

    .table-card { border-radius: 12px; overflow: hidden; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .users-table { width: 100%; }

    .user-cell { display: flex; align-items: center; gap: 14px; padding: 8px 0; }
    .avatar { width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; color: white; flex-shrink: 0; }
    .avatar-customer { background: linear-gradient(135deg, #40916C, #1B4332); }
    .avatar-admin { background: linear-gradient(135deg, #1565c0, #0d47a1); }
    .avatar-super_admin { background: linear-gradient(135deg, #7b1fa2, #4a148c); }

    .user-info { display: flex; flex-direction: column; }
    .user-info strong { font-size: 0.95rem; color: #1a1a1a; }
    .user-info small { color: #666; font-size: 0.8rem; }
    .phone { color: #888 !important; }

    .role-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
    .role-badge mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .role-customer { background: #e8f5e9; color: #2e7d32; }
    .role-admin { background: #e3f2fd; color: #1565c0; }
    .role-super_admin { background: #f3e5f5; color: #7b1fa2; }

    .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
    .status-badge mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-inactive { background: #ffebee; color: #c62828; }

    .never { color: #bbb; font-style: italic; font-size: 0.85rem; }

    .action-group { display: flex; align-items: center; gap: 8px; }
    .role-select { width: 150px; margin: 0; }
    .role-select ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .role-select ::ng-deep .mat-mdc-text-field-wrapper { padding: 0 8px; }

    .inactive-row { opacity: 0.55; background: #fafafa; }

    .empty-state { text-align: center; padding: 60px; color: #999; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ddd; display: block; margin: 0 auto 12px; }

    @media (max-width: 900px) {
      .columns { display: none; }
      .action-group { flex-direction: column; }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  total = 0;
  loading = true;
  columns = ['user', 'role', 'status', 'joined', 'lastLogin', 'actions'];
  filterForm: FormGroup;
  roleStats: { label: string; count: number }[] = [];

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.filterForm = this.fb.group({ role: [''], isActive: [''] });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(page = 1) {
    this.loading = true;
    const filters: any = { page, limit: 20 };
    if (this.filterForm.value.role) filters.role = this.filterForm.value.role;

    this.adminService.getUsers(filters).subscribe({
      next: (res) => {
        this.users = res.data.users;
        this.total = res.total;
        this.loading = false;
        this.computeStats(res.data.users);
      },
      error: () => { this.loading = false; },
    });
  }

  computeStats(users: any[]) {
    const counts = { customer: 0, admin: 0, super_admin: 0, inactive: 0 };
    users.forEach((u) => {
      if (counts[u.role as keyof typeof counts] !== undefined) counts[u.role as keyof typeof counts]++;
      if (!u.isActive) counts.inactive++;
    });
    this.roleStats = [
      { label: 'Total', count: this.total },
      { label: 'Customers', count: counts.customer },
      { label: 'Admins', count: counts.admin },
      { label: 'Super Admins', count: counts.super_admin },
      { label: 'Deactivated', count: counts.inactive },
    ];
  }

  changeRole(user: any, newRole: string) {
    if (user.role === newRole) return;
    const prev = user.role;
    user.role = newRole; // optimistic update

    this.adminService.updateUserRole(user._id, newRole).subscribe({
      next: () => {
        this.snackBar.open(
          `${user.name}'s role changed to ${newRole}`,
          'Close',
          { duration: 3000, panelClass: 'snack-success' }
        );
        this.computeStats(this.users);
      },
      error: (err) => {
        user.role = prev; // revert
        this.snackBar.open(err.error?.message || 'Failed to update role', 'Close', { duration: 3000 });
      },
    });
  }

  toggleActive(user: any) {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) return;

    const prev = user.isActive;
    user.isActive = !user.isActive; // optimistic update

    this.adminService.toggleUserActive(user._id).subscribe({
      next: () => {
        this.snackBar.open(
          `${user.name}'s account ${user.isActive ? 'activated' : 'deactivated'}`,
          'Close',
          { duration: 3000 }
        );
        this.computeStats(this.users);
      },
      error: (err) => {
        user.isActive = prev; // revert
        this.snackBar.open('Failed to update account status', 'Close', { duration: 3000 });
      },
    });
  }

  isSelf(user: any): boolean {
    return false; // Could check against current user ID
  }

  getRoleIcon(role: string): string {
    const icons: Record<string, string> = {
      customer: 'person',
      admin: 'admin_panel_settings',
      super_admin: 'shield',
    };
    return icons[role] || 'person';
  }

  onPage(event: PageEvent) {
    this.loadUsers(event.pageIndex + 1);
  }
}
