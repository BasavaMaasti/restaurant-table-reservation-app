import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { Reservation } from '../../../core/models/reservation.model';
import { ReservationActions } from '../../../store/reservation/reservation.actions';
import { selectAllReservations, selectReservationsLoading } from '../../../store/reservation/reservation.selectors';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatChipsModule, MatProgressSpinnerModule, MatBadgeModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><mat-icon>calendar_today</mat-icon> My Reservations</h1>
        <a mat-raised-button color="primary" routerLink="/restaurants">
          <mat-icon>add</mat-icon> New Reservation
        </a>
      </div>

      <div class="loading-center" *ngIf="loading$ | async">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <mat-tab-group *ngIf="!(loading$ | async)" (selectedTabChange)="onTabChange($event)">
        <mat-tab label="Upcoming">
          <ng-container *ngTemplateOutlet="reservationList; context: { reservations: getFiltered('upcoming') }"></ng-container>
        </mat-tab>
        <mat-tab label="Past">
          <ng-container *ngTemplateOutlet="reservationList; context: { reservations: getFiltered('past') }"></ng-container>
        </mat-tab>
        <mat-tab label="Cancelled">
          <ng-container *ngTemplateOutlet="reservationList; context: { reservations: getFiltered('cancelled') }"></ng-container>
        </mat-tab>
      </mat-tab-group>

      <ng-template #reservationList let-reservations="reservations">
        <div class="tab-content">
          <div class="empty-state" *ngIf="reservations.length === 0">
            <mat-icon>event_available</mat-icon>
            <h3>No reservations here</h3>
            <p>Browse restaurants to make a booking</p>
            <a mat-raised-button color="primary" routerLink="/restaurants">Find Restaurants</a>
          </div>

          <div class="reservation-list">
            <mat-card class="reservation-card" *ngFor="let r of reservations" [routerLink]="['/reservations', r._id]">
              <div class="card-body">
                <div class="restaurant-image">
                  <img [src]="r.restaurant?.coverImage || r.restaurant?.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200'"
                    [alt]="r.restaurant?.name">
                </div>
                <div class="card-info">
                  <div class="card-header">
                    <h3>{{ r.restaurant?.name }}</h3>
                    <span class="status-badge" [class]="'status-' + r.status">{{ r.status | uppercase }}</span>
                  </div>
                  <div class="card-details">
                    <div class="detail"><mat-icon>calendar_today</mat-icon> {{ r.reservationDate | date:'EEE, MMM d, y' }}</div>
                    <div class="detail"><mat-icon>schedule</mat-icon> {{ r.timeSlot?.startTime }} - {{ r.timeSlot?.endTime }}</div>
                    <div class="detail"><mat-icon>group</mat-icon> {{ r.guestCount }} Guests</div>
                    <div class="detail"><mat-icon>table_restaurant</mat-icon> Table {{ r.table?.tableNumber }}</div>
                  </div>
                  <div class="confirmation-code">
                    <mat-icon>confirmation_number</mat-icon> {{ r.confirmationCode }}
                  </div>
                </div>
                <div class="card-actions">
                  <a mat-icon-button [routerLink]="['/reservations', r._id]" (click)="$event.stopPropagation()">
                    <mat-icon>chevron_right</mat-icon>
                  </a>
                </div>
              </div>
            </mat-card>
          </div>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; font-size: 1.8rem; color: #1B4332; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 60px; }
    .tab-content { padding: 24px 0; }
    .reservation-list { display: flex; flex-direction: column; gap: 16px; }
    .reservation-card { border-radius: 12px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s; }
    .reservation-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .card-body { display: flex; align-items: stretch; }
    .restaurant-image { width: 120px; flex-shrink: 0; }
    .restaurant-image img { width: 100%; height: 100%; object-fit: cover; }
    .card-info { flex: 1; padding: 16px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .card-header h3 { font-size: 1.1rem; color: #1a1a1a; margin: 0; }
    .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
    .status-confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-pending { background: #fff8e1; color: #f57f17; }
    .status-cancelled { background: #ffebee; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .status-seated { background: #e8f5e9; color: #1B4332; }
    .status-no_show { background: #fce4ec; color: #880e4f; }
    .card-details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .detail { display: flex; align-items: center; gap: 6px; color: #555; font-size: 0.85rem; }
    .detail mat-icon { font-size: 16px; width: 16px; height: 16px; color: #1B4332; }
    .confirmation-code { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #888; margin-top: 8px; }
    .confirmation-code mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .card-actions { display: flex; align-items: center; padding: 8px; }
    .empty-state { text-align: center; padding: 60px 20px; color: #999; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ddd; display: block; margin: 0 auto 16px; }
    .empty-state h3 { margin-bottom: 8px; color: #555; }
    @media (max-width: 600px) { .card-details { grid-template-columns: 1fr; } .restaurant-image { width: 80px; } }
  `]
})
export class ReservationListComponent implements OnInit {
  reservations$: Observable<Reservation[]>;
  loading$: Observable<boolean>;
  allReservations: Reservation[] = [];
  today = new Date();

  constructor(private store: Store) {
    this.reservations$ = this.store.select(selectAllReservations);
    this.loading$ = this.store.select(selectReservationsLoading);
  }

  ngOnInit() {
    this.store.dispatch(ReservationActions.loadMyReservations({}));
    this.reservations$.subscribe((res) => (this.allReservations = res));
  }

  getFiltered(type: 'upcoming' | 'past' | 'cancelled'): Reservation[] {
    return this.allReservations.filter((r) => {
      const date = new Date(r.reservationDate);
      if (type === 'upcoming') return date >= this.today && r.status !== 'cancelled';
      if (type === 'past') return (date < this.today || r.status === 'completed') && r.status !== 'cancelled';
      if (type === 'cancelled') return r.status === 'cancelled';
      return true;
    });
  }

  onTabChange(event: any) {}
}
