import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { SocketService } from '../../../core/services/socket.service';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatBadgeModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatChipsModule, MatSnackBarModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div>
          <h1><mat-icon>dashboard</mat-icon> Admin Dashboard</h1>
          <p>Welcome back, {{ (user$ | async)?.name }}</p>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/admin/reservations"><mat-icon>event</mat-icon> Reservations</a>
          <a mat-stroked-button routerLink="/admin/tables"><mat-icon>table_restaurant</mat-icon> Tables</a>
        </div>
      </div>

      <div *ngIf="loading" class="loading-center"><mat-spinner diameter="48"></mat-spinner></div>

      <ng-container *ngIf="!loading && stats">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <mat-card class="stat-card">
            <mat-icon>today</mat-icon>
            <div>
              <span class="stat-value">{{ stats.todayReservations }}</span>
              <span class="stat-label">Today's Bookings</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>calendar_month</mat-icon>
            <div>
              <span class="stat-value">{{ stats.monthReservations }}</span>
              <span class="stat-label">This Month</span>
              <span class="stat-change" [class.positive]="stats.monthGrowth >= 0" [class.negative]="stats.monthGrowth < 0">
                {{ stats.monthGrowth >= 0 ? '+' : '' }}{{ stats.monthGrowth }}% vs last month
              </span>
            </div>
          </mat-card>
          <mat-card class="stat-card warning" *ngIf="stats.pendingReservations > 0">
            <mat-icon>pending_actions</mat-icon>
            <div>
              <span class="stat-value">{{ stats.pendingReservations }}</span>
              <span class="stat-label">Pending Approval</span>
            </div>
          </mat-card>
          <mat-card class="stat-card">
            <mat-icon>people</mat-icon>
            <div>
              <span class="stat-value">{{ stats.totalUsers }}</span>
              <span class="stat-label">Total Customers</span>
            </div>
          </mat-card>
        </div>

        <!-- Recent Reservations -->
        <mat-card class="recent-card">
          <mat-card-header>
            <mat-card-title>Recent Reservations</mat-card-title>
            <a mat-button routerLink="/admin/reservations" class="view-all">View All</a>
          </mat-card-header>
          <mat-card-content>
            <table mat-table [dataSource]="recentReservations" class="res-table">
              <ng-container matColumnDef="customer">
                <th mat-header-cell *matHeaderCellDef>Customer</th>
                <td mat-cell *matCellDef="let r">
                  <div class="customer-cell">
                    <div class="avatar">{{ r.customer?.name?.charAt(0) }}</div>
                    <div><strong>{{ r.customer?.name }}</strong><small>{{ r.customer?.email }}</small></div>
                  </div>
                </td>
              </ng-container>
              <ng-container matColumnDef="restaurant">
                <th mat-header-cell *matHeaderCellDef>Restaurant</th>
                <td mat-cell *matCellDef="let r">{{ r.restaurant?.name }}</td>
              </ng-container>
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                <td mat-cell *matCellDef="let r">
                  <div>{{ r.reservationDate | date:'MMM d, y' }}</div>
                  <small>{{ r.timeSlot?.startTime }}</small>
                </td>
              </ng-container>
              <ng-container matColumnDef="guests">
                <th mat-header-cell *matHeaderCellDef>Guests</th>
                <td mat-cell *matCellDef="let r">{{ r.guestCount }}</td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let r">
                  <span class="status-chip" [class]="'status-' + r.status">{{ r.status }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let r">
                  <button mat-icon-button (click)="updateStatus(r, 'confirmed')" *ngIf="r.status === 'pending'" title="Confirm">
                    <mat-icon color="primary">check_circle</mat-icon>
                  </button>
                  <button mat-icon-button (click)="updateStatus(r, 'seated')" *ngIf="r.status === 'confirmed'" title="Mark Seated">
                    <mat-icon style="color:#ff9800">restaurant</mat-icon>
                  </button>
                  <button mat-icon-button (click)="updateStatus(r, 'completed')" *ngIf="r.status === 'seated'" title="Complete">
                    <mat-icon color="accent">task_alt</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Charts Placeholder -->
        <mat-card class="charts-card">
          <mat-card-header>
            <mat-card-title>Bookings Trend (Last 30 Days)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-area">
              <div *ngFor="let d of chartData" class="chart-bar-container" [title]="d._id + ': ' + d.count + ' bookings'">
                <div class="chart-bar" [style.height.px]="getBarHeight(d.count)"></div>
                <small>{{ d._id | slice:5 }}</small>
              </div>
            </div>
            <div class="chart-legend">
              <span><strong>Total bookings</strong> in selected period</span>
            </div>
          </mat-card-content>
        </mat-card>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
    .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .dashboard-header h1 { display: flex; align-items: center; gap: 12px; font-size: 1.8rem; color: #1B4332; margin: 0 0 4px; }
    .dashboard-header p { color: #666; margin: 0; }
    .header-actions { display: flex; gap: 12px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 28px; }
    .stat-card { display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 12px; }
    .stat-card mat-icon { font-size: 44px; width: 44px; height: 44px; color: #1B4332; }
    .stat-card.warning mat-icon { color: #f57f17; }
    .stat-value { display: block; font-size: 2rem; font-weight: 700; color: #1a1a1a; line-height: 1; }
    .stat-label { display: block; color: #666; font-size: 0.85rem; margin-top: 4px; }
    .stat-change { display: block; font-size: 0.8rem; margin-top: 2px; }
    .stat-change.positive { color: #2e7d32; }
    .stat-change.negative { color: #c62828; }
    .recent-card, .charts-card { border-radius: 12px; margin-bottom: 24px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .view-all { margin-left: auto; }
    .res-table { width: 100%; }
    .customer-cell { display: flex; align-items: center; gap: 12px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #1B4332; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .customer-cell strong { display: block; font-size: 0.9rem; }
    .customer-cell small { color: #666; font-size: 0.78rem; }
    .status-chip { padding: 4px 12px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize; }
    .status-confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-seated { background: #fff3e0; color: #e65100; }
    .chart-area { display: flex; align-items: flex-end; gap: 4px; height: 200px; border-bottom: 2px solid #eee; overflow-x: auto; padding-bottom: 8px; }
    .chart-bar-container { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
    .chart-bar { width: 20px; background: #40916C; border-radius: 3px 3px 0 0; transition: height 0.3s; }
    .chart-bar-container small { font-size: 0.6rem; color: #999; transform: rotate(-45deg); }
    .chart-legend { text-align: center; padding-top: 12px; color: #666; font-size: 0.85rem; }
    @media (max-width: 768px) { .dashboard-header { flex-direction: column; gap: 16px; } .stats-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any;
  recentReservations: any[] = [];
  chartData: any[] = [];
  loading = true;
  displayedColumns = ['customer', 'restaurant', 'date', 'guests', 'status', 'actions'];
  user$ = this.store.select(selectCurrentUser);
  maxCount = 1;

  constructor(
    private adminService: AdminService,
    private reservationService: ReservationService,
    private snackBar: MatSnackBar,
    private store: Store,
  ) {}

  ngOnInit() {
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        this.stats = res.data.stats;
        this.recentReservations = res.data.recentReservations;
        this.chartData = res.data.revenueData;
        this.maxCount = Math.max(...this.chartData.map((d: any) => d.count), 1);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  getBarHeight(count: number): number {
    return Math.max((count / this.maxCount) * 160, 4);
  }

  updateStatus(reservation: any, status: string) {
    this.reservationService.updateStatus(reservation._id, status).subscribe({
      next: (res) => {
        reservation.status = status;
        this.snackBar.open(`Reservation ${status}!`, 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to update status', 'Close', { duration: 3000 })
    });
  }
}
