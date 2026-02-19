import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Restaurant } from '../../../core/models/restaurant.model';
import { RestaurantActions } from '../../../store/restaurant/restaurant.actions';
import { selectAllRestaurants, selectRestaurantsLoading, selectRestaurantsTotal } from '../../../store/restaurant/restaurant.selectors';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatSelectModule, MatFormFieldModule, MatChipsModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <div class="page-container">
      <!-- Hero Section -->
      <div class="hero">
        <h1>Find Your Perfect Table</h1>
        <p>Discover and book the best restaurants in your city</p>

        <!-- Search Bar -->
        <form [formGroup]="filterForm" class="search-bar">
          <mat-form-field appearance="outline" class="search-input">
            <input matInput formControlName="search" placeholder="Search restaurants, cuisine, location...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Cuisine</mat-label>
            <mat-select formControlName="cuisine">
              <mat-option value="">All Cuisines</mat-option>
              <mat-option *ngFor="let c of cuisines" [value]="c">{{ c }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Price</mat-label>
            <mat-select formControlName="priceRange">
              <mat-option value="">Any Price</mat-option>
              <mat-option value="$">$ (Budget)</mat-option>
              <mat-option value="$$">$$ (Moderate)</mat-option>
              <mat-option value="$$$">$$$ (Upscale)</mat-option>
              <mat-option value="$$$$">$$$$ (Fine Dining)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Min Rating</mat-label>
            <mat-select formControlName="rating">
              <mat-option value="">Any Rating</mat-option>
              <mat-option value="4">4+ Stars</mat-option>
              <mat-option value="4.5">4.5+ Stars</mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </div>

      <!-- Results -->
      <div class="results-section">
        <div class="results-header">
          <h2>{{ (total$ | async) }} Restaurants Found</h2>
          <mat-form-field appearance="outline" class="sort-select">
            <mat-label>Sort By</mat-label>
            <mat-select [formControl]="sortControl">
              <mat-option value="-rating">Highest Rated</mat-option>
              <mat-option value="-totalReviews">Most Reviewed</mat-option>
              <mat-option value="name">Name A-Z</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="loading-container" *ngIf="loading$ | async">
          <mat-spinner diameter="48"></mat-spinner>
        </div>

        <div class="restaurant-grid" *ngIf="!(loading$ | async)">
          <mat-card class="restaurant-card" *ngFor="let r of restaurants$ | async"
            routerLink="/restaurants/{{ r._id }}" [class.clickable]="true">
            <div class="card-image">
              <img [src]="r.coverImage || r.images?.[0] || 'assets/default-restaurant.jpg'"
                [alt]="r.name" loading="lazy">
              <div class="price-badge">{{ r.priceRange }}</div>
              <div class="verified-badge" *ngIf="r.isVerified">
                <mat-icon>verified</mat-icon>
              </div>
            </div>

            <mat-card-content>
              <div class="card-header">
                <h3>{{ r.name }}</h3>
                <div class="rating">
                  <mat-icon class="star">star</mat-icon>
                  <span>{{ r.rating | number:'1.1-1' }}</span>
                  <small>({{ r.totalReviews }})</small>
                </div>
              </div>

              <div class="cuisine-chips">
                <span class="chip" *ngFor="let c of r.cuisine.slice(0,3)">{{ c }}</span>
              </div>

              <p class="address">
                <mat-icon>location_on</mat-icon>
                {{ r.address.street }}, {{ r.address.city }}
              </p>

              <div class="card-features" *ngIf="r.features?.length">
                <span class="feature" *ngFor="let f of r.features.slice(0,3)">{{ f }}</span>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-raised-button color="primary" [routerLink]="['/restaurants', r._id]" (click)="$event.stopPropagation()">
                Book a Table
              </button>
              <div class="table-info">
                <mat-icon>table_restaurant</mat-icon>
                {{ r.totalTables }} tables
              </div>
            </mat-card-actions>
          </mat-card>

          <div class="empty-state" *ngIf="(restaurants$ | async)?.length === 0">
            <mat-icon>search_off</mat-icon>
            <h3>No restaurants found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        </div>

        <mat-paginator
          [length]="total$ | async"
          [pageSize]="12"
          [pageSizeOptions]="[6, 12, 24]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1400px; margin: 0 auto; }
    .hero { background: linear-gradient(135deg, #1B4332, #40916C); color: white; padding: 60px 24px 80px; text-align: center; }
    .hero h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
    .hero p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 32px; }
    .search-bar { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; max-width: 900px; margin: 0 auto; }
    .search-input { flex: 1; min-width: 280px; }
    .filter-select { width: 160px; }
    .search-bar mat-form-field { background: white; border-radius: 4px; }
    .results-section { padding: 24px; }
    .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .results-header h2 { font-size: 1.3rem; color: #333; }
    .sort-select { width: 180px; }
    .restaurant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .restaurant-card { border-radius: 12px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .restaurant-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
    .card-image { position: relative; height: 200px; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .price-badge { position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; }
    .verified-badge { position: absolute; top: 12px; left: 12px; background: #1B4332; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
    .verified-badge mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .card-header h3 { font-size: 1.1rem; color: #1a1a1a; margin: 0; flex: 1; }
    .rating { display: flex; align-items: center; gap: 2px; white-space: nowrap; }
    .rating .star { color: #f59e0b; font-size: 18px; width: 18px; height: 18px; }
    .rating span { font-weight: 700; color: #333; }
    .rating small { color: #666; }
    .cuisine-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .chip { background: #e8f5e9; color: #1B4332; padding: 2px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
    .address { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.85rem; margin: 8px 0; }
    .address mat-icon { font-size: 16px; width: 16px; height: 16px; color: #999; }
    .card-features { display: flex; gap: 6px; flex-wrap: wrap; }
    .feature { background: #f5f5f5; color: #555; padding: 2px 8px; border-radius: 10px; font-size: 0.75rem; }
    mat-card-actions { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px 16px; }
    .table-info { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.85rem; }
    .table-info mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .loading-container { display: flex; justify-content: center; padding: 80px; }
    .empty-state { text-align: center; padding: 80px; grid-column: 1/-1; color: #999; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ddd; display: block; margin: 0 auto 16px; }
    @media (max-width: 768px) {
      .hero h1 { font-size: 1.8rem; }
      .search-bar { flex-direction: column; }
      .search-input, .filter-select { width: 100%; }
      .results-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    }
  `]
})
export class RestaurantListComponent implements OnInit, OnDestroy {
  restaurants$: Observable<Restaurant[]>;
  loading$: Observable<boolean>;
  total$: Observable<number>;
  filterForm: FormGroup;
  private destroy$ = new Subject<void>();

  cuisines = ['Italian', 'Indian', 'Chinese', 'Mexican', 'Mediterranean', 'Japanese', 'Thai', 'Continental', 'Seafood', 'American'];

  constructor(private store: Store, private fb: FormBuilder) {
    this.restaurants$ = this.store.select(selectAllRestaurants);
    this.loading$ = this.store.select(selectRestaurantsLoading);
    this.total$ = this.store.select(selectRestaurantsTotal);

    this.filterForm = this.fb.group({
      search: [''],
      cuisine: [''],
      priceRange: [''],
      rating: [''],
      sort: ['-rating'],
    });
  }

  ngOnInit() {
    this.loadRestaurants();

    this.filterForm.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.loadRestaurants());
  }

  loadRestaurants(page = 1) {
    const filters = { ...this.filterForm.value, page, limit: 12 };
    this.store.dispatch(RestaurantActions.loadRestaurants({ filters }));
  }

  onPageChange(event: PageEvent) {
    this.loadRestaurants(event.pageIndex + 1);
  }
get sortControl() {
  return this.filterForm.get('sort') as import('@angular/forms').FormControl;
}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
