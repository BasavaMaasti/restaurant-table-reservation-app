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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Restaurant } from '../../../core/models/restaurant.model';
import { RestaurantActions } from '../../../store/restaurant/restaurant.actions';
import { selectAllRestaurants, selectRestaurantsLoading, selectRestaurantsTotal } from '../../../store/restaurant/restaurant.selectors';

@Component({
  selector: 'app-restaurant-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-wrapper">

      <!-- ─── Hero Section ─── -->
      <div class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="hero-badge">🍽️ Restaurant Discovery</div>
          <h1>Find Your Perfect Table</h1>
          <p>Discover and book the best restaurants in your city</p>

          <!-- Search Card -->
          <div class="search-card" [formGroup]="filterForm">

            <!-- Main Search -->
            <div class="search-main">
              <div class="search-input-wrap">
                <mat-icon class="search-icon">search</mat-icon>
                <input
                  class="search-input"
                  formControlName="search"
                  placeholder="Search by restaurant name, cuisine or location...">
                <button class="search-btn" (click)="loadRestaurants()">Search</button>
              </div>
            </div>

            <!-- Filter Pills -->
            <div class="filter-row">
              <div class="filter-item">
                <mat-icon class="filter-icon">restaurant_menu</mat-icon>
                <select class="filter-select" formControlName="cuisine">
                  <option value="">🍜 All Cuisines</option>
                  <option *ngFor="let c of cuisines" [value]="c">{{ c }}</option>
                </select>
                <mat-icon class="filter-chevron">expand_more</mat-icon>
              </div>

              <div class="filter-divider"></div>

              <div class="filter-item">
                <mat-icon class="filter-icon">attach_money</mat-icon>
                <select class="filter-select" formControlName="priceRange">
                  <option value="">💰 Any Price</option>
                  <option value="$">$ — Budget Friendly</option>
                  <option value="$$">$$ — Moderate</option>
                  <option value="$$$">$$$ — Upscale</option>
                  <option value="$$$$">$$$$ — Fine Dining</option>
                </select>
                <mat-icon class="filter-chevron">expand_more</mat-icon>
              </div>

              <div class="filter-divider"></div>

              <div class="filter-item">
                <mat-icon class="filter-icon">star</mat-icon>
                <select class="filter-select" formControlName="rating">
                  <option value="">⭐ Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
                <mat-icon class="filter-chevron">expand_more</mat-icon>
              </div>

              <div class="filter-divider"></div>

              <button class="clear-btn" (click)="clearFilters()" *ngIf="hasFilters()">
                <mat-icon>close</mat-icon> Clear
              </button>
            </div>
          </div>

          <!-- Quick Filter Tags -->
          <div class="quick-tags">
            <button class="quick-tag" *ngFor="let tag of quickTags"
              [class.tag-active]="filterForm.get('cuisine')?.value === tag.value"
              (click)="setQuickTag(tag.value)">
              {{ tag.emoji }} {{ tag.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- ─── Results Section ─── -->
      <div class="results-section">
        <div class="results-header">
          <div class="results-left">
            <h2>
              <ng-container *ngIf="!(loading$ | async)">
                <span class="result-count">{{ total$ | async }}</span>
                Restaurants Found
              </ng-container>
            </h2>
            <div class="active-filters" *ngIf="hasFilters()">
              <span class="filter-tag" *ngIf="filterForm.get('cuisine')?.value">
                {{ filterForm.get('cuisine')?.value }}
                <button (click)="clearField('cuisine')">×</button>
              </span>
              <span class="filter-tag" *ngIf="filterForm.get('priceRange')?.value">
                {{ filterForm.get('priceRange')?.value }}
                <button (click)="clearField('priceRange')">×</button>
              </span>
              <span class="filter-tag" *ngIf="filterForm.get('rating')?.value">
                {{ filterForm.get('rating')?.value }}+ Stars
                <button (click)="clearField('rating')">×</button>
              </span>
            </div>
          </div>

          <div class="sort-wrap">
            <mat-icon class="sort-icon">sort</mat-icon>
            <select class="sort-select" [formControl]="$any(filterForm.get('sort'))">
              <option value="-rating">Highest Rated</option>
              <option value="-totalReviews">Most Popular</option>
              <option value="name">Name A–Z</option>
              <option value="priceRange">Price: Low to High</option>
            </select>
          </div>
        </div>

        <!-- Loading -->
        <div class="loading-state" *ngIf="loading$ | async">
          <div class="skeleton-grid">
            <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6]">
              <div class="skeleton-img"></div>
              <div class="skeleton-body">
                <div class="skeleton-line long"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line short"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid -->
        <div class="restaurant-grid" *ngIf="!(loading$ | async)">
          <div class="restaurant-card" *ngFor="let r of restaurants$ | async"
            [routerLink]="['/restaurants', r._id]">

            <!-- Image -->
            <div class="card-img-wrap">
              <img [src]="r.coverImage || r.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'"
                [alt]="r.name" loading="lazy">
              <div class="img-overlay"></div>

              <div class="card-top-badges">
                <span class="verified-chip" *ngIf="r.isVerified">
                  <mat-icon>verified</mat-icon>
                </span>
                <span class="price-chip">{{ r.priceRange }}</span>
              </div>

              <div class="rating-chip">
                <mat-icon>star</mat-icon>
                {{ r.rating | number:'1.1-1' }}
                <span>({{ r.totalReviews }})</span>
              </div>
            </div>

            <!-- Content -->
            <div class="card-content">
              <h3>{{ r.name }}</h3>

              <div class="cuisine-row">
                <span class="cuisine-tag" *ngFor="let c of r.cuisine?.slice(0,3)">{{ c }}</span>
              </div>

              <div class="card-meta">
                <span class="meta-item">
                  <mat-icon>location_on</mat-icon>
                  {{ r.address?.street }}, {{ r.address?.city }}
                </span>
                <span class="meta-item">
                  <mat-icon>table_restaurant</mat-icon>
                  {{ r.totalTables }} tables
                </span>
              </div>

              <div class="card-features" *ngIf="r.features?.length">
                <span class="feature-pill" *ngFor="let f of r.features?.slice(0,3)">{{ f }}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <button class="book-btn" [routerLink]="['/restaurants', r._id]" (click)="$event.stopPropagation()">
                <mat-icon>event_available</mat-icon> Book a Table
              </button>
            </div>
          </div>

          <!-- Empty state -->
          <div class="empty-state" *ngIf="(restaurants$ | async)?.length === 0">
            <div class="empty-icon">🔍</div>
            <h3>No restaurants found</h3>
            <p>Try adjusting your filters or search term</p>
            <button class="clear-all-btn" (click)="clearFilters()">Clear All Filters</button>
          </div>
        </div>

        <!-- Paginator -->
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
    /* ─── Page ─── */
    .page-wrapper { min-height: 100vh; background: #f8f9fa; }

    /* ─── Hero ─── */
    .hero {
      position: relative;
      background: linear-gradient(160deg, #0d2b1f 0%, #1B4332 45%, #2d6a4f 100%);
      padding: 60px 24px 80px;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      background: url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400') center/cover;
      opacity: 0.07;
    }
    .hero-content {
      position: relative;
      max-width: 860px;
      margin: 0 auto;
      text-align: center;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.9);
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      margin-bottom: 20px;
    }
    .hero-content h1 {
      font-size: 3rem;
      font-weight: 800;
      color: white;
      margin: 0 0 12px;
      line-height: 1.1;
      letter-spacing: -0.5px;
    }
    .hero-content p {
      font-size: 1.1rem;
      color: rgba(255,255,255,0.7);
      margin: 0 0 36px;
    }

    /* ─── Search Card ─── */
    .search-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
      margin-bottom: 20px;
    }

    /* Main search row */
    .search-main { padding: 4px; }
    .search-input-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
    }
    .search-icon { color: #1B4332; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; }
    .search-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      color: #1a1a1a;
      background: transparent;
      padding: 10px 8px;
    }
    .search-input::placeholder { color: #aaa; }
    .search-btn {
      background: #1B4332;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 10px 24px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .search-btn:hover { background: #2d6a4f; }

    /* Filter row */
    .filter-row {
      display: flex;
      align-items: center;
      border-top: 1px solid #f0f0f0;
      padding: 0 8px;
      gap: 0;
      overflow-x: auto;
    }
    .filter-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      flex: 1;
      min-width: 140px;
      position: relative;
    }
    .filter-icon { font-size: 18px; width: 18px; height: 18px; color: #1B4332; flex-shrink: 0; }
    .filter-select {
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.88rem;
      color: #444;
      cursor: pointer;
      flex: 1;
      appearance: none;
      -webkit-appearance: none;
    }
    .filter-select option { color: #333; }
    .filter-chevron { font-size: 16px; width: 16px; height: 16px; color: #aaa; flex-shrink: 0; }
    .filter-divider { width: 1px; height: 32px; background: #f0f0f0; flex-shrink: 0; }
    .clear-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 14px;
      border: none;
      background: #fff3f3;
      color: #c62828;
      border-radius: 10px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      margin: 6px;
      flex-shrink: 0;
    }
    .clear-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Quick Tags */
    .quick-tags {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .quick-tag {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.85);
      padding: 7px 16px;
      border-radius: 20px;
      font-size: 0.83rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .quick-tag:hover { background: rgba(255,255,255,0.22); color: white; }
    .tag-active { background: white !important; color: #1B4332 !important; font-weight: 700; }

    /* ─── Results ─── */
    .results-section { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      gap: 16px;
    }
    .results-left { display: flex; flex-direction: column; gap: 10px; }
    .results-left h2 { font-size: 1.3rem; color: #1a1a1a; margin: 0; display: flex; align-items: center; gap: 10px; }
    .result-count {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1B4332;
      line-height: 1;
    }
    .active-filters { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e8f5e9;
      color: #1B4332;
      padding: 4px 10px 4px 12px;
      border-radius: 16px;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .filter-tag button {
      background: none;
      border: none;
      color: #1B4332;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0 2px;
    }
    .sort-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 8px 14px;
      flex-shrink: 0;
    }
    .sort-icon { color: #1B4332; font-size: 18px; width: 18px; height: 18px; }
    .sort-select {
      border: none;
      outline: none;
      font-size: 0.88rem;
      color: #333;
      cursor: pointer;
      background: transparent;
      font-weight: 500;
    }

    /* ─── Skeleton Loading ─── */
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .skeleton-card { border-radius: 16px; overflow: hidden; background: white; }
    .skeleton-img { height: 200px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .skeleton-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .skeleton-line { height: 14px; border-radius: 7px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .skeleton-line.long { width: 80%; }
    .skeleton-line.medium { width: 60%; }
    .skeleton-line.short { width: 40%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* ─── Restaurant Grid ─── */
    .restaurant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; margin-bottom: 32px; }

    .restaurant-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #f0f0f0;
      display: flex;
      flex-direction: column;
    }
    .restaurant-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.12); }

    /* Card Image */
    .card-img-wrap { position: relative; height: 200px; overflow: hidden; }
    .card-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .restaurant-card:hover .card-img-wrap img { transform: scale(1.05); }
    .img-overlay { position: absolute; inset: 0; background: linear-gradient(transparent 40%, rgba(0,0,0,0.4)); }

    .card-top-badges { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; }
    .verified-chip {
      background: #1B4332;
      color: white;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .verified-chip mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .price-chip {
      background: rgba(0,0,0,0.65);
      color: white;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 800;
      backdrop-filter: blur(4px);
    }
    .rating-chip {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(0,0,0,0.7);
      color: white;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 700;
      backdrop-filter: blur(4px);
    }
    .rating-chip mat-icon { font-size: 15px; width: 15px; height: 15px; color: #fbbf24; }
    .rating-chip span { color: rgba(255,255,255,0.7); font-size: 0.75rem; font-weight: 400; }

    /* Card Body */
    .card-content { padding: 16px 16px 8px; flex: 1; }
    .card-content h3 { font-size: 1.1rem; font-weight: 700; color: #1a1a1a; margin: 0 0 8px; }
    .cuisine-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .cuisine-tag { background: #e8f5e9; color: #1B4332; padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 600; }
    .card-meta { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
    .meta-item { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; color: #666; }
    .meta-item mat-icon { font-size: 15px; width: 15px; height: 15px; color: #999; }
    .card-features { display: flex; gap: 6px; flex-wrap: wrap; }
    .feature-pill { background: #f5f5f5; color: #555; padding: 3px 10px; border-radius: 10px; font-size: 0.72rem; }

    /* Card Footer */
    .card-footer { padding: 12px 16px 16px; border-top: 1px solid #f5f5f5; margin-top: auto; }
    .book-btn {
      width: 100%;
      background: #1B4332;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 11px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.15s;
    }
    .book-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .book-btn:hover { background: #2d6a4f; }

    /* Empty */
    .empty-state { grid-column: 1/-1; text-align: center; padding: 80px 20px; }
    .empty-icon { font-size: 4rem; margin-bottom: 16px; }
    .empty-state h3 { font-size: 1.3rem; color: #555; margin-bottom: 8px; }
    .empty-state p { color: #999; margin-bottom: 24px; }
    .clear-all-btn { background: #1B4332; color: white; border: none; border-radius: 10px; padding: 12px 28px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }

    /* Responsive */
    @media (max-width: 768px) {
      .hero-content h1 { font-size: 2rem; }
      .filter-row { flex-wrap: wrap; }
      .filter-divider { display: none; }
      .results-header { flex-direction: column; }
    }
    @media (max-width: 480px) {
      .hero-content h1 { font-size: 1.6rem; }
      .search-btn { padding: 10px 14px; font-size: 0.85rem; }
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

  quickTags = [
    { label: 'Italian', value: 'Italian', emoji: '🍕' },
    { label: 'Indian', value: 'Indian', emoji: '🍛' },
    { label: 'Japanese', value: 'Japanese', emoji: '🍱' },
    { label: 'Chinese', value: 'Chinese', emoji: '🥡' },
    { label: 'Seafood', value: 'Seafood', emoji: '🦐' },
    { label: 'Mediterranean', value: 'Mediterranean', emoji: '🥙' },
  ];

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

  setQuickTag(cuisine: string) {
    const current = this.filterForm.get('cuisine')?.value;
    this.filterForm.patchValue({ cuisine: current === cuisine ? '' : cuisine });
  }

  clearField(field: string) {
    this.filterForm.patchValue({ [field]: '' });
  }

  clearFilters() {
    this.filterForm.patchValue({ search: '', cuisine: '', priceRange: '', rating: '' });
  }

  hasFilters(): boolean {
    const v = this.filterForm.value;
    return !!(v.search || v.cuisine || v.priceRange || v.rating);
  }

  onPageChange(event: PageEvent) {
    this.loadRestaurants(event.pageIndex + 1);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
