import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RestaurantActions } from '../../../store/restaurant/restaurant.actions';
import { ReservationActions } from '../../../store/reservation/reservation.actions';
import { selectSelectedRestaurant, selectAvailability, selectRestaurantsLoading } from '../../../store/restaurant/restaurant.selectors';
import { selectReservationCreating, selectReservationError } from '../../../store/reservation/reservation.selectors';
import { selectIsLoggedIn } from '../../../store/auth/auth.selectors';
import { SocketService } from '../../../core/services/socket.service';
import { TimeSlot, TableSlot } from '../../../core/models/restaurant.model';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule, MatDatepickerModule, MatNativeDateModule, MatDividerModule, MatSnackBarModule],
  template: `
    <div *ngIf="loading$ | async" class="loading-center"><mat-spinner diameter="60"></mat-spinner></div>

    <div *ngIf="restaurant$ | async as r" class="detail-page">
      <!-- Hero -->
      <div class="hero-image">
        <img [src]="r.coverImage || r.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'" [alt]="r.name">
        <div class="hero-overlay">
          <div class="hero-content">
            <h1>{{ r.name }}</h1>
            <div class="hero-meta">
              <span class="rating"><mat-icon>star</mat-icon> {{ r.rating | number:'1.1-1' }} ({{ r.totalReviews }} reviews)</span>
              <span class="price">{{ r.priceRange }}</span>
              <span *ngFor="let c of r.cuisine" class="cuisine-tag">{{ c }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <!-- Info Column -->
        <div class="info-column">
          <mat-tab-group>
            <mat-tab label="Overview">
              <div class="tab-content">
                <p class="description">{{ r.description }}</p>
                <mat-divider></mat-divider>
                <div class="info-section">
                  <h3><mat-icon>location_on</mat-icon> Location</h3>
                  <p>{{ r.address.street }}, {{ r.address.city }}, {{ r.address.state }} {{ r.address.zip }}</p>
                  <p *ngIf="r.phone"><mat-icon>phone</mat-icon> {{ r.phone }}</p>
                  <p *ngIf="r.email"><mat-icon>email</mat-icon> {{ r.email }}</p>
                </div>
                <mat-divider></mat-divider>
                <div class="info-section">
                  <h3><mat-icon>stars</mat-icon> Amenities</h3>
                  <div class="features-grid">
                    <span class="feature-chip" *ngFor="let f of r.features"><mat-icon>check</mat-icon> {{ f }}</span>
                  </div>
                </div>
                <mat-divider></mat-divider>
                <div class="info-section">
                  <h3><mat-icon>schedule</mat-icon> Hours</h3>
                  <div class="hours-list">
                    <div class="hour-row" *ngFor="let h of r.operatingHours" [class.closed]="h.isClosed">
                      <span class="day">{{ h.day }}</span>
                      <span>{{ h.isClosed ? 'Closed' : h.open + ' - ' + h.close }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>

        <!-- Booking Column -->
        <div class="booking-column">
          <mat-card class="booking-card">
            <mat-card-header>
              <mat-card-title>Reserve a Table</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="searchForm" (ngSubmit)="checkAvailability()" class="search-form">
                <mat-form-field appearance="outline">
                  <mat-label>Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="date" [min]="minDate">
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Number of Guests</mat-label>
                  <mat-select formControlName="guestCount">
                    <mat-option *ngFor="let n of guestOptions" [value]="n">{{ n }} {{ n === 1 ? 'Guest' : 'Guests' }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit" [disabled]="searchForm.invalid || (loading$ | async)">
                  Check Availability
                </button>
              </form>

              <!-- Slots -->
              <div *ngIf="availability$ | async as avail" class="slots-section">
                <h4>Available Times</h4>
                <p *ngIf="avail.slots?.length === 0" class="no-slots">No slots available for this date/party size.</p>

                <div class="slots-grid">
                  <button *ngFor="let slot of avail.slots" mat-stroked-button
                    [class.slot-available]="slot.available"
                    [class.slot-booked]="!slot.available"
                    [class.slot-selected]="selectedSlot?.startTime === slot.startTime"
                    [disabled]="!slot.available"
                    (click)="selectSlot(slot)">
                    {{ slot.displayTime }}
                    <br><small>{{ slot.available ? slot.availableTablesCount + ' tables' : 'Full' }}</small>
                  </button>
                </div>

                <!-- Table Selection -->
                <div *ngIf="selectedSlot" class="table-select-section">
                  <h4>Choose Table</h4>
                  <div class="tables-grid">
                    <div *ngFor="let table of selectedSlot.tables"
                      class="table-option"
                      [class.table-selected]="selectedTable?._id === table._id"
                      (click)="selectTable(table)">
                      <mat-icon>table_restaurant</mat-icon>
                      <strong>{{ table.tableNumber }}</strong>
                      <small>{{ table.section }} | {{ table.capacity }} seats</small>
                      <div class="table-features">
                        <span *ngFor="let f of table.features" class="mini-chip">{{ f }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Booking Form -->
                <div *ngIf="selectedTable" class="booking-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Occasion (Optional)</mat-label>
                    <mat-select [formControl]="occasionCtrl">
                      <mat-option value="">No Special Occasion</mat-option>
                      <mat-option *ngFor="let o of occasions" [value]="o.value">{{ o.label }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Special Requests (Optional)</mat-label>
                    <textarea matInput [formControl]="requestsCtrl" rows="3"
                      placeholder="Dietary restrictions, seating preferences, special celebrations..."></textarea>
                  </mat-form-field>

                  <div class="summary-box">
                    <div class="sum-row"><mat-icon>calendar_today</mat-icon><span>{{ searchForm.value.date | date:'EEE, MMM d, y' }}</span></div>
                    <div class="sum-row"><mat-icon>schedule</mat-icon><span>{{ selectedSlot?.displayTime }}</span></div>
                    <div class="sum-row"><mat-icon>group</mat-icon><span>{{ searchForm.value.guestCount }} Guests</span></div>
                    <div class="sum-row"><mat-icon>table_restaurant</mat-icon><span>Table {{ selectedTable.tableNumber }} ({{ selectedTable.section }})</span></div>
                  </div>

                  <div class="error-banner" *ngIf="bookingError$ | async as err">
                    <mat-icon>warning</mat-icon> {{ err }}
                  </div>

                  <ng-container *ngIf="isLoggedIn$ | async; else loginPrompt">
                    <button mat-raised-button color="primary" class="confirm-btn"
                      (click)="bookTable(r)" [disabled]="creating$ | async">
                      <mat-spinner *ngIf="creating$ | async" diameter="20"></mat-spinner>
                      <span *ngIf="!(creating$ | async)">Confirm Reservation</span>
                    </button>
                  </ng-container>
                  <ng-template #loginPrompt>
                    <a mat-raised-button color="primary" routerLink="/auth/login"
                      [queryParams]="{returnUrl: '/restaurants/' + r._id}" class="confirm-btn">
                      Sign In to Reserve
                    </a>
                  </ng-template>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-center { display:flex; justify-content:center; align-items:center; min-height:60vh; }
    .hero-image { position:relative; height:380px; overflow:hidden; }
    .hero-image img { width:100%; height:100%; object-fit:cover; }
    .hero-overlay { position:absolute; inset:0; background:linear-gradient(transparent 20%, rgba(0,0,0,0.75)); display:flex; align-items:flex-end; }
    .hero-content { padding:32px; color:white; }
    .hero-content h1 { font-size:2.2rem; font-weight:700; margin:0 0 12px; }
    .hero-meta { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .rating { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.15); padding:4px 12px; border-radius:20px; }
    .rating mat-icon { color:#f59e0b; font-size:18px; width:18px; height:18px; }
    .price { font-size:1.1rem; font-weight:700; color:#74C69D; }
    .cuisine-tag { background:rgba(255,255,255,0.2); padding:4px 12px; border-radius:12px; font-size:0.85rem; }
    .content-grid { display:grid; grid-template-columns:1fr 380px; gap:32px; max-width:1200px; margin:32px auto; padding:0 24px; }
    .tab-content { padding:24px 0; }
    .description { color:#555; line-height:1.8; font-size:1rem; }
    .info-section { padding:20px 0; }
    .info-section h3 { display:flex; align-items:center; gap:8px; color:#1B4332; margin-bottom:16px; }
    .features-grid { display:flex; flex-wrap:wrap; gap:10px; }
    .feature-chip { display:flex; align-items:center; gap:6px; background:#e8f5e9; color:#1B4332; padding:6px 14px; border-radius:20px; font-size:0.85rem; }
    .feature-chip mat-icon { font-size:16px; width:16px; height:16px; }
    .hours-list { display:grid; gap:8px; }
    .hour-row { display:flex; justify-content:space-between; padding:8px 12px; border-radius:8px; background:#f9f9f9; }
    .hour-row.closed { color:#999; }
    .day { font-weight:600; color:#333; }
    .booking-card { position:sticky; top:80px; border-radius:16px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
    .search-form { display:flex; flex-direction:column; gap:12px; margin-bottom:16px; }
    mat-form-field { width:100%; }
    .slots-section { margin-top:20px; border-top:1px solid #eee; padding-top:20px; }
    .slots-section h4, .table-select-section h4 { color:#1B4332; margin-bottom:12px; }
    .slots-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; margin-bottom:16px; }
    .slot-available { border-color:#1B4332 !important; color:#1B4332 !important; }
    .slot-booked { opacity:0.4; }
    .slot-selected { background:#1B4332 !important; color:white !important; }
    .slots-grid button { padding:8px 4px; font-size:0.8rem; line-height:1.3; }
    .tables-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
    .table-option { padding:12px; border:2px solid #eee; border-radius:10px; cursor:pointer; text-align:center; transition:all 0.2s; }
    .table-option:hover { border-color:#40916C; }
    .table-selected { border-color:#1B4332; background:#e8f5e9; }
    .table-option mat-icon { color:#1B4332; display:block; margin:0 auto 4px; }
    .table-option strong { display:block; font-size:0.9rem; }
    .table-option small { color:#666; font-size:0.75rem; display:block; }
    .table-features { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin-top:6px; }
    .mini-chip { background:#f0f0f0; padding:1px 6px; border-radius:8px; font-size:0.7rem; }
    .booking-form { display:flex; flex-direction:column; gap:12px; margin-top:16px; border-top:1px solid #eee; padding-top:16px; }
    .summary-box { background:#f9f9f9; border-radius:10px; padding:16px; }
    .sum-row { display:flex; align-items:center; gap:10px; padding:6px 0; color:#555; font-size:0.9rem; }
    .sum-row mat-icon { color:#1B4332; font-size:18px; width:18px; height:18px; }
    .error-banner { background:#ffebee; color:#c62828; border-radius:8px; padding:10px 14px; display:flex; align-items:center; gap:8px; font-size:0.9rem; }
    .confirm-btn { width:100%; height:48px; font-size:1rem; font-weight:600; display:flex; align-items:center; justify-content:center; gap:8px; }
    .no-slots { color:#999; text-align:center; padding:20px; }
    @media(max-width:900px) { .content-grid { grid-template-columns:1fr; } .booking-card { position:static; } }
  `]
})
export class RestaurantDetailComponent implements OnInit, OnDestroy {
  restaurant$ = this.store.select(selectSelectedRestaurant);
  availability$ = this.store.select(selectAvailability);
  loading$ = this.store.select(selectRestaurantsLoading);
  creating$ = this.store.select(selectReservationCreating);
  bookingError$ = this.store.select(selectReservationError);
  isLoggedIn$ = this.store.select(selectIsLoggedIn);

  searchForm: FormGroup;
  occasionCtrl = new FormControl('');
  requestsCtrl = new FormControl('');
  selectedSlot: TimeSlot | null = null;
  selectedTable: TableSlot | null = null;
  minDate = new Date();
  guestOptions = [1,2,3,4,5,6,7,8,9,10];
  private destroy$ = new Subject<void>();

  occasions = [
    { value: 'birthday', label: 'Birthday' },
    { value: 'anniversary', label: 'Anniversary' },
    { value: 'business', label: 'Business Dinner' },
    { value: 'date', label: 'Date Night' },
    { value: 'family', label: 'Family Gathering' },
    { value: 'other', label: 'Other' },
  ];

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private socketService: SocketService,
  ) {
    this.searchForm = this.fb.group({
      date: ['', Validators.required],
      guestCount: [2, Validators.required],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.dispatch(RestaurantActions.loadRestaurant({ id }));
    this.socketService.joinRestaurantRoom(id);

    // Listen for real-time table updates
    this.socketService.onTableUpdate().pipe(takeUntil(this.destroy$)).subscribe(() => {
      // Re-check availability if a slot was selected
      if (this.searchForm.valid) this.checkAvailability();
    });
  }

  checkAvailability() {
    if (this.searchForm.invalid) return;
    const restaurantId = this.route.snapshot.paramMap.get('id')!;
    const date = this.searchForm.value.date instanceof Date
      ? this.searchForm.value.date.toISOString().split('T')[0]
      : this.searchForm.value.date;
    this.selectedSlot = null;
    this.selectedTable = null;
    this.store.dispatch(RestaurantActions.checkAvailability({
      restaurantId,
      date,
      guestCount: this.searchForm.value.guestCount,
    }));
  }

  selectSlot(slot: TimeSlot) {
    if (!slot.available) return;
    this.selectedSlot = slot;
    this.selectedTable = null;
  }

  selectTable(table: TableSlot) {
    this.selectedTable = table;
  }

  bookTable(restaurant: any) {
    if (!this.selectedSlot || !this.selectedTable) return;
    const date = this.searchForm.value.date instanceof Date
      ? this.searchForm.value.date.toISOString().split('T')[0]
      : this.searchForm.value.date;

    this.store.dispatch(ReservationActions.createReservation({
      data: {
        restaurantId: restaurant._id,
        tableId: this.selectedTable._id,
        reservationDate: date,
        startTime: this.selectedSlot.startTime,
        endTime: this.selectedSlot.endTime,
        guestCount: this.searchForm.value.guestCount,
        occasion: this.occasionCtrl.value || '',
        specialRequests: this.requestsCtrl.value || '',
      },
    }));
  }

  ngOnDestroy() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.socketService.leaveRestaurantRoom(id);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
