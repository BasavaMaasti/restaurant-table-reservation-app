import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatPaginatorModule, MatDatepickerModule, MatNativeDateModule, MatSnackBarModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><mat-icon>event</mat-icon> Manage Reservations</h1>
        <a mat-button routerLink="/admin"><mat-icon>arrow_back</mat-icon> Dashboard</a>
      </div>

      <!-- Filters -->
      <mat-card class="filter-card">
        <form [formGroup]="filterForm" class="filter-form">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">All Status</mat-option>
              <mat-option *ngFor="let s of statuses" [value]="s.value">{{ s.label }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="dp" formControlName="date">
            <mat-datepicker-toggle matSuffix [for]="dp"></mat-datepicker-toggle>
            <mat-datepicker #dp></mat-datepicker>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="loadReservations()">
            <mat-icon>search</mat-icon> Filter
          </button>
          <button mat-stroked-button (click)="filterForm.reset(); loadReservations()">
            <mat-icon>clear</mat-icon> Clear
          </button>
        </form>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <div *ngIf="loading" class="loading-center"><mat-spinner diameter="48"></mat-spinner></div>

        <table mat-table [dataSource]="reservations" *ngIf="!loading">
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Customer</th>
            <td mat-cell *matCellDef="let r">
              <strong>{{ r.customer?.name }}</strong><br>
              <small>{{ r.customer?.email }}</small>
            </td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Date & Time</th>
            <td mat-cell *matCellDef="let r">
              {{ r.reservationDate | date:'MMM d, y' }}<br>
              <small>{{ r.timeSlot?.startTime }}</small>
            </td>
          </ng-container>
          <ng-container matColumnDef="guests">
            <th mat-header-cell *matHeaderCellDef>Guests</th>
            <td mat-cell *matCellDef="let r">{{ r.guestCount }}</td>
          </ng-container>
          <ng-container matColumnDef="table">
            <th mat-header-cell *matHeaderCellDef>Table</th>
            <td mat-cell *matCellDef="let r">{{ r.table?.tableNumber }} ({{ r.table?.section }})</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <span class="status-chip" [class]="'status-' + r.status">{{ r.status }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="confirmation">
            <th mat-header-cell *matHeaderCellDef>Confirmation</th>
            <td mat-cell *matCellDef="let r"><small>{{ r.confirmationCode }}</small></td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="changeStatus(r, 'confirmed')" *ngIf="r.status === 'pending'" title="Confirm">
                <mat-icon color="primary">check_circle</mat-icon>
              </button>
              <button mat-icon-button (click)="changeStatus(r, 'seated')" *ngIf="r.status === 'confirmed'" title="Seat">
                <mat-icon style="color:#f57f17">restaurant</mat-icon>
              </button>
              <button mat-icon-button (click)="changeStatus(r, 'completed')" *ngIf="r.status === 'seated'" title="Complete">
                <mat-icon color="accent">done_all</mat-icon>
              </button>
              <button mat-icon-button (click)="changeStatus(r, 'no_show')" *ngIf="r.status === 'confirmed'" title="No Show">
                <mat-icon color="warn">person_off</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; color: #1B4332; margin: 0; font-size: 1.6rem; }
    .filter-card { border-radius: 12px; margin-bottom: 20px; }
    .filter-form { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-end; padding: 8px 0; }
    .filter-form mat-form-field { width: 200px; }
    .table-card { border-radius: 12px; overflow: hidden; }
    table { width: 100%; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .status-chip { padding: 4px 12px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize; }
    .status-confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-seated { background: #fff3e0; color: #e65100; }
    .status-no_show { background: #fce4ec; color: #880e4f; }
  `]
})
export class AdminReservationsComponent implements OnInit {
  reservations: any[] = [];
  total = 0;
  loading = true;
  columns = ['customer', 'date', 'guests', 'table', 'status', 'confirmation', 'actions'];
  filterForm: FormGroup;
  statuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'seated', label: 'Seated' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'no_show', label: 'No Show' },
  ];

  constructor(private adminService: AdminService, private reservationService: ReservationService, private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.filterForm = this.fb.group({ status: [''], date: [''] });
  }

  ngOnInit() { this.loadReservations(); }

  loadReservations(page = 1) {
    this.loading = true;
    const filters: any = { page, limit: 20 };
    if (this.filterForm.value.status) filters.status = this.filterForm.value.status;
    if (this.filterForm.value.date) {
      const d = this.filterForm.value.date;
      filters.date = d instanceof Date ? d.toISOString().split('T')[0] : d;
    }
    this.adminService.getReservations(filters).subscribe({
      next: (res) => { this.reservations = res.data.reservations; this.total = res.total; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  onPage(event: PageEvent) { this.loadReservations(event.pageIndex + 1); }

  changeStatus(reservation: any, status: string) {
    this.reservationService.updateStatus(reservation._id, status).subscribe({
      next: () => { reservation.status = status; this.snackBar.open(`Status updated to ${status}`, 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to update', 'Close', { duration: 3000 }),
    });
  }
}
