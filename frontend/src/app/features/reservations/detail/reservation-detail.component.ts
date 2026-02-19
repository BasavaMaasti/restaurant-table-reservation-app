import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Reservation } from '../../../core/models/reservation.model';
import { ReservationActions } from '../../../store/reservation/reservation.actions';
import { selectSelectedReservation, selectReservationsLoading } from '../../../store/reservation/reservation.selectors';

@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div *ngIf="loading$ | async" class="loading-center"><mat-spinner diameter="48"></mat-spinner></div>

      <div *ngIf="reservation$ | async as r" class="detail-layout">
        <div class="page-header">
          <a mat-button routerLink="/reservations"><mat-icon>arrow_back</mat-icon> My Reservations</a>
          <span class="status-badge" [class]="'status-' + r.status">{{ r.status | uppercase }}</span>
        </div>

        <div class="content-grid">
          <!-- Main Details -->
          <mat-card class="main-card">
            <mat-card-header>
              <mat-card-title>Reservation Details</mat-card-title>
              <mat-card-subtitle>Confirmation: {{ r.confirmationCode }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="restaurant-info" *ngIf="r.restaurant">
                <img [src]="r.restaurant.coverImage || r.restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300'" [alt]="r.restaurant.name">
                <div>
                  <h2>{{ r.restaurant.name }}</h2>
                  <p><mat-icon>location_on</mat-icon> {{ r.restaurant.address?.street }}, {{ r.restaurant.address?.city }}</p>
                  <p *ngIf="r.restaurant.phone"><mat-icon>phone</mat-icon> {{ r.restaurant.phone }}</p>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="details-grid">
                <div class="detail-item">
                  <mat-icon>calendar_today</mat-icon>
                  <div><small>Date</small><strong>{{ r.reservationDate | date:'EEEE, MMMM d, y' }}</strong></div>
                </div>
                <div class="detail-item">
                  <mat-icon>schedule</mat-icon>
                  <div><small>Time</small><strong>{{ r.timeSlot?.startTime }} - {{ r.timeSlot?.endTime }}</strong></div>
                </div>
                <div class="detail-item">
                  <mat-icon>group</mat-icon>
                  <div><small>Guests</small><strong>{{ r.guestCount }} {{ r.guestCount === 1 ? 'Guest' : 'Guests' }}</strong></div>
                </div>
                <div class="detail-item">
                  <mat-icon>table_restaurant</mat-icon>
                  <div><small>Table</small><strong>{{ r.table?.tableNumber }} ({{ r.table?.section }})</strong></div>
                </div>
                <div class="detail-item" *ngIf="r.occasion">
                  <mat-icon>celebration</mat-icon>
                  <div><small>Occasion</small><strong>{{ r.occasion | titlecase }}</strong></div>
                </div>
              </div>

              <div class="special-requests" *ngIf="r.specialRequests">
                <mat-icon>notes</mat-icon>
                <div><small>Special Requests</small><p>{{ r.specialRequests }}</p></div>
              </div>

              <div class="cancellation-info" *ngIf="r.status === 'cancelled'">
                <mat-icon>cancel</mat-icon>
                <div>
                  <strong>Cancelled on {{ r.cancelledAt | date:'mediumDate' }}</strong>
                  <p *ngIf="r.cancellationReason">Reason: {{ r.cancellationReason }}</p>
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions *ngIf="r.status === 'confirmed' || r.status === 'pending'">
              <button mat-raised-button color="warn" (click)="cancelReservation(r)">
                <mat-icon>cancel</mat-icon> Cancel Reservation
              </button>
            </mat-card-actions>
          </mat-card>

          <!-- QR Code + Summary -->
          <div class="side-column">
            <mat-card class="qr-card" *ngIf="r.qrCode">
              <mat-card-header>
                <mat-card-title>Check-In QR Code</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <img [src]="r.qrCode" alt="QR Code" class="qr-image">
                <p class="qr-hint">Show this at the restaurant for check-in</p>
              </mat-card-content>
            </mat-card>

            <mat-card class="customer-card">
              <mat-card-header><mat-card-title>Contact Info</mat-card-title></mat-card-header>
              <mat-card-content>
                <div class="info-row"><mat-icon>person</mat-icon> {{ r.customerName }}</div>
                <div class="info-row"><mat-icon>email</mat-icon> {{ r.customerEmail }}</div>
                <div class="info-row" *ngIf="r.customerPhone"><mat-icon>phone</mat-icon> {{ r.customerPhone }}</div>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .status-badge { padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; }
    .status-confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-seated { background: #e8f5e9; color: #1B4332; }
    .content-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
    .main-card { border-radius: 12px; }
    .restaurant-info { display: flex; gap: 16px; padding: 16px 0; }
    .restaurant-info img { width: 100px; height: 100px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
    .restaurant-info h2 { margin: 0 0 8px; }
    .restaurant-info p { display: flex; align-items: center; gap: 6px; color: #666; margin: 4px 0; font-size: 0.9rem; }
    .restaurant-info mat-icon { font-size: 16px; width: 16px; height: 16px; color: #1B4332; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px 0; }
    .detail-item { display: flex; align-items: flex-start; gap: 12px; }
    .detail-item mat-icon { color: #1B4332; margin-top: 4px; }
    .detail-item small { color: #999; display: block; font-size: 0.75rem; }
    .detail-item strong { font-size: 0.95rem; }
    .special-requests { display: flex; gap: 12px; background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 8px; }
    .special-requests mat-icon { color: #1B4332; flex-shrink: 0; }
    .special-requests small { color: #999; font-size: 0.75rem; }
    .cancellation-info { display: flex; gap: 12px; background: #ffebee; padding: 16px; border-radius: 8px; margin-top: 8px; }
    .cancellation-info mat-icon { color: #c62828; flex-shrink: 0; }
    .side-column { display: flex; flex-direction: column; gap: 16px; }
    .qr-card { border-radius: 12px; text-align: center; }
    .qr-image { width: 180px; height: 180px; margin: 8px auto; display: block; }
    .qr-hint { color: #666; font-size: 0.8rem; text-align: center; }
    .customer-card { border-radius: 12px; }
    .info-row { display: flex; align-items: center; gap: 10px; padding: 8px 0; color: #555; font-size: 0.9rem; }
    .info-row mat-icon { color: #1B4332; font-size: 18px; width: 18px; height: 18px; }
    @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } .details-grid { grid-template-columns: 1fr; } }
  `]
})
export class ReservationDetailComponent implements OnInit {
  reservation$: Observable<Reservation | null>;
  loading$: Observable<boolean>;

  constructor(private store: Store, private route: ActivatedRoute) {
    this.reservation$ = this.store.select(selectSelectedReservation);
    this.loading$ = this.store.select(selectReservationsLoading);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(ReservationActions.loadReservation({ id }));
  }

  cancelReservation(r: Reservation) {
    if (confirm('Are you sure you want to cancel this reservation?')) {
      this.store.dispatch(ReservationActions.cancelReservation({ id: r._id, reason: 'Cancelled by customer' }));
    }
  }
}
