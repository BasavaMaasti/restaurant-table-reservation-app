import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { environment } from '../../../../environments/environment';
import { selectCurrentUser, selectIsSuperAdmin } from '../../../store/auth/auth.selectors';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-admin-restaurants',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatInputModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSlideToggleModule,
    MatTooltipModule, MatSnackBarModule, MatChipsModule,
    MatTabsModule, MatDividerModule, MatExpansionModule,
    MatStepperModule, MatCheckboxModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1><mat-icon>store</mat-icon> Restaurant Management</h1>
          <p class="subtitle">Add, edit, manage images and settings for restaurants</p>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="primary" (click)="openForm(null)" *ngIf="!showForm">
            <mat-icon>add</mat-icon> Add Restaurant
          </button>
          <a mat-stroked-button routerLink="/admin"><mat-icon>arrow_back</mat-icon> Dashboard</a>
        </div>
      </div>

      <!-- ADD / EDIT FORM -->
      <mat-card class="form-card" *ngIf="showForm">
        <mat-card-header>
          <mat-card-title>{{ editingId ? 'Edit Restaurant' : 'Add New Restaurant' }}</mat-card-title>
          <button mat-icon-button (click)="closeForm()" class="close-btn"><mat-icon>close</mat-icon></button>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="restaurantForm" class="restaurant-form">
            <mat-tab-group>

              <!-- ── Basic Info ── -->
              <mat-tab label="Basic Info">
                <div class="tab-section">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Restaurant Name *</mat-label>
                      <input matInput formControlName="name" placeholder="e.g. The Green Bistro">
                      <mat-error>Name is required</mat-error>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Price Range *</mat-label>
                      <mat-select formControlName="priceRange">
                        <mat-option value="$">$ — Budget friendly</mat-option>
                        <mat-option value="$$">$$ — Moderate</mat-option>
                        <mat-option value="$$$">$$$ — Upscale</mat-option>
                        <mat-option value="$$$$">$$$$ — Fine Dining</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="3"
                      placeholder="Describe the restaurant's atmosphere, specialty, history..."></textarea>
                    <mat-hint align="end">{{ restaurantForm.get('description')?.value?.length || 0 }}/1000</mat-hint>
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Phone</mat-label>
                      <input matInput formControlName="phone" placeholder="+91-22-12345678">
                      <mat-icon matPrefix>phone</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Email</mat-label>
                      <input matInput formControlName="email" placeholder="info@restaurant.com">
                      <mat-icon matPrefix>email</mat-icon>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Website (Optional)</mat-label>
                    <input matInput formControlName="website" placeholder="https://yourrestaurant.com">
                    <mat-icon matPrefix>language</mat-icon>
                  </mat-form-field>

                  <div class="section-label">Cuisine Types *</div>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-select formControlName="cuisine" multiple placeholder="Select cuisines">
                      <mat-option *ngFor="let c of cuisineOptions" [value]="c">{{ c }}</mat-option>
                    </mat-select>
                    <mat-error>At least one cuisine required</mat-error>
                  </mat-form-field>

                  <div class="section-label">Amenities & Features</div>
                  <div class="checkbox-grid">
                    <mat-checkbox *ngFor="let f of featureOptions"
                      [checked]="isFeatureSelected(f)"
                      (change)="toggleFeature(f, $event.checked)">
                      {{ f }}
                    </mat-checkbox>
                  </div>

                  <div class="form-row" style="margin-top:16px">
                    <mat-form-field appearance="outline">
                      <mat-label>Reservation Duration (mins)</mat-label>
                      <input matInput type="number" formControlName="reservationDuration" min="30" max="240">
                      <mat-hint>How long each booking lasts</mat-hint>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Slot Interval (mins)</mat-label>
                      <input matInput type="number" formControlName="slotInterval" min="15" max="60">
                      <mat-hint>Time between available slots</mat-hint>
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- ── Address ── -->
              <mat-tab label="Address">
                <div class="tab-section">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Street Address *</mat-label>
                    <input matInput formControlName="street" placeholder="123 Main Street">
                    <mat-icon matPrefix>location_on</mat-icon>
                  </mat-form-field>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>City *</mat-label>
                      <input matInput formControlName="city">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>State *</mat-label>
                      <input matInput formControlName="state">
                    </mat-form-field>
                  </div>

                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>ZIP / Postal Code *</mat-label>
                      <input matInput formControlName="zip">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Country</mat-label>
                      <input matInput formControlName="country">
                    </mat-form-field>
                  </div>

                  <div class="section-label">GPS Coordinates (Optional — for map search)</div>
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Latitude</mat-label>
                      <input matInput type="number" formControlName="latitude" placeholder="19.0760">
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Longitude</mat-label>
                      <input matInput type="number" formControlName="longitude" placeholder="72.8777">
                    </mat-form-field>
                  </div>
                </div>
              </mat-tab>

              <!-- ── Opening Hours ── -->
              <mat-tab label="Opening Hours">
                <div class="tab-section">
                  <div formArrayName="operatingHours" class="hours-list">
                    <div class="hour-row" *ngFor="let day of operatingHoursArray.controls; let i = index" [formGroupName]="i">
                      <div class="day-name">{{ days[i] }}</div>

                      <mat-slide-toggle formControlName="isClosed" class="closed-toggle"
                        [color]="'warn'"
                        (change)="onClosedToggle(i, $event.checked)">
                        {{ day.get('isClosed')?.value ? 'Closed' : 'Open' }}
                      </mat-slide-toggle>

                      <mat-form-field appearance="outline" class="time-field" *ngIf="!day.get('isClosed')?.value">
                        <mat-label>Open</mat-label>
                        <input matInput type="time" formControlName="open">
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="time-field" *ngIf="!day.get('isClosed')?.value">
                        <mat-label>Close</mat-label>
                        <input matInput type="time" formControlName="close">
                      </mat-form-field>

                      <div class="closed-placeholder" *ngIf="day.get('isClosed')?.value">
                        Restaurant is closed on this day
                      </div>
                    </div>
                  </div>
                </div>
              </mat-tab>

              <!-- ── Images ── -->
              <mat-tab label="Images">
                <div class="tab-section">
                  <!-- Cover Image -->
                  <div class="section-label">Cover Image</div>
                  <div class="image-upload-area" (click)="triggerUpload('cover')" [class.has-image]="coverPreview">
                    <img *ngIf="coverPreview" [src]="coverPreview" alt="Cover" class="preview-img">
                    <div *ngIf="!coverPreview" class="upload-placeholder">
                      <mat-icon>add_photo_alternate</mat-icon>
                      <span>Click to upload cover image</span>
                      <small>Recommended: 1200×400px</small>
                    </div>
                    <div class="upload-overlay" *ngIf="coverPreview">
                      <mat-icon>edit</mat-icon> Change Cover
                    </div>
                    <div class="uploading-overlay" *ngIf="uploadingCover">
                      <mat-spinner diameter="36"></mat-spinner>
                    </div>
                  </div>
                  <input type="file" #coverInput accept="image/*" style="display:none"
                    (change)="onImageSelected($event, 'cover')">

                  <mat-divider style="margin: 24px 0"></mat-divider>

                  <!-- Gallery Images -->
                  <div class="section-label">Gallery Images</div>
                  <div class="gallery-grid">
                    <div class="gallery-item" *ngFor="let img of galleryImages; let i = index">
                      <img [src]="img" alt="Gallery">
                      <button mat-icon-button class="remove-img-btn" (click)="removeGalleryImage(i)">
                        <mat-icon>close</mat-icon>
                      </button>
                    </div>

                    <div class="gallery-add" (click)="triggerUpload('gallery')" *ngIf="galleryImages.length < 8">
                      <mat-spinner diameter="24" *ngIf="uploadingGallery"></mat-spinner>
                      <ng-container *ngIf="!uploadingGallery">
                        <mat-icon>add_photo_alternate</mat-icon>
                        <span>Add Photo</span>
                      </ng-container>
                    </div>
                  </div>
                  <input type="file" #galleryInput accept="image/*" style="display:none"
                    (change)="onImageSelected($event, 'gallery')">
                  <small class="hint">Upload up to 8 gallery photos. {{ galleryImages.length }}/8 used.</small>
                </div>
              </mat-tab>

            </mat-tab-group>

            <!-- Form Actions -->
            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="closeForm()">Cancel</button>
              <button mat-raised-button color="primary" type="button"
                (click)="saveRestaurant()" [disabled]="saving">
                <mat-spinner *ngIf="saving" diameter="20"></mat-spinner>
                <span *ngIf="!saving">{{ editingId ? 'Save Changes' : 'Create Restaurant' }}</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- RESTAURANT LIST -->
      <div class="loading-center" *ngIf="loadingList"><mat-spinner diameter="48"></mat-spinner></div>

      <div class="restaurant-grid" *ngIf="!loadingList && !showForm">

        <div class="empty-state" *ngIf="restaurants.length === 0">
          <mat-icon>store</mat-icon>
          <h3>No restaurants yet</h3>
          <p>Click "Add Restaurant" to get started</p>
          <button mat-raised-button color="primary" (click)="openForm(null)">
            <mat-icon>add</mat-icon> Add Your First Restaurant
          </button>
        </div>

        <mat-card class="restaurant-card" *ngFor="let r of restaurants">
          <!-- Cover Image -->
          <div class="card-cover">
            <img [src]="r.coverImage || r.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600'"
              [alt]="r.name">
            <div class="card-badges">
              <span class="price-badge">{{ r.priceRange }}</span>
              <span class="verified-badge" *ngIf="r.isVerified"><mat-icon>verified</mat-icon></span>
              <span class="inactive-badge" *ngIf="!r.isActive">INACTIVE</span>
            </div>
          </div>

          <mat-card-content>
            <div class="card-top">
              <div>
                <h3>{{ r.name }}</h3>
                <p class="address-text">
                  <mat-icon>location_on</mat-icon>
                  {{ r.address?.street }}, {{ r.address?.city }}
                </p>
              </div>
              <div class="rating-pill">
                <mat-icon>star</mat-icon>
                {{ r.rating | number:'1.1-1' }}
                <small>({{ r.totalReviews }})</small>
              </div>
            </div>

            <div class="cuisine-row">
              <span class="cuisine-chip" *ngFor="let c of r.cuisine?.slice(0,3)">{{ c }}</span>
            </div>

            <div class="stats-row">
              <div class="stat"><mat-icon>table_restaurant</mat-icon> {{ r.totalTables }} Tables</div>
              <div class="stat"><mat-icon>people</mat-icon> Cap: {{ r.totalCapacity }}</div>
              <div class="stat"><mat-icon>schedule</mat-icon> {{ r.reservationDuration }}min slots</div>
            </div>
          </mat-card-content>

          <mat-card-actions class="card-actions">
            <!-- Edit -->
            <button mat-stroked-button (click)="openForm(r)">
              <mat-icon>edit</mat-icon> Edit
            </button>

            <!-- Toggle Active/Inactive -->
            <button mat-stroked-button [color]="r.isActive ? 'warn' : 'primary'"
              (click)="toggleRestaurantActive(r)">
              <mat-icon>{{ r.isActive ? 'visibility_off' : 'visibility' }}</mat-icon>
              {{ r.isActive ? 'Deactivate' : 'Activate' }}
            </button>

            <!-- Delete (Super Admin only) -->
            <button mat-icon-button color="warn" *ngIf="isSuperAdmin$ | async"
              (click)="deleteRestaurant(r)"
              matTooltip="Permanently delete restaurant">
              <mat-icon>delete_forever</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; color: #1B4332; margin: 0 0 4px; font-size: 1.7rem; }
    .subtitle { color: #666; margin: 0; font-size: 0.9rem; }
    .header-actions { display: flex; gap: 12px; }

    /* Form */
    .form-card { border-radius: 16px; margin-bottom: 32px; position: relative; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0; }
    .close-btn { margin-left: auto; }
    .restaurant-form { padding: 8px 0; }
    .tab-section { padding: 24px 0; display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-row mat-form-field { width: 100%; }
    .section-label { font-weight: 600; color: #1B4332; font-size: 0.9rem; margin-bottom: -4px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid #eee; margin-top: 8px; }

    /* Hours */
    .hours-list { display: flex; flex-direction: column; gap: 12px; }
    .hour-row { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #f9f9f9; border-radius: 10px; }
    .day-name { font-weight: 600; color: #333; width: 100px; flex-shrink: 0; }
    .closed-toggle { flex-shrink: 0; }
    .time-field { width: 130px; flex-shrink: 0; }
    .time-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .closed-placeholder { color: #999; font-style: italic; font-size: 0.88rem; }

    /* Image Upload */
    .image-upload-area { position: relative; height: 180px; border: 2px dashed #ccc; border-radius: 12px; cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s; }
    .image-upload-area:hover { border-color: #1B4332; }
    .image-upload-area.has-image { border-style: solid; border-color: #1B4332; }
    .preview-img { width: 100%; height: 100%; object-fit: cover; }
    .upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #999; }
    .upload-placeholder mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .upload-placeholder small { font-size: 0.78rem; }
    .upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; gap: 8px; color: white; font-weight: 600; opacity: 0; transition: opacity 0.2s; }
    .image-upload-area:hover .upload-overlay { opacity: 1; }
    .uploading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; }
    .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .gallery-item { position: relative; height: 120px; border-radius: 10px; overflow: hidden; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .remove-img-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5) !important; color: white !important; width: 28px; height: 28px; }
    .remove-img-btn mat-icon { font-size: 16px; line-height: 28px; }
    .gallery-add { height: 120px; border: 2px dashed #ccc; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; cursor: pointer; color: #999; transition: all 0.2s; }
    .gallery-add:hover { border-color: #1B4332; color: #1B4332; }
    .gallery-add mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .gallery-add span { font-size: 0.8rem; }
    .hint { color: #999; font-size: 0.8rem; margin-top: 8px; display: block; }

    /* Restaurant Cards */
    .loading-center { display: flex; justify-content: center; padding: 80px; }
    .restaurant-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
    .restaurant-card { border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s; }
    .restaurant-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
    .card-cover { position: relative; height: 180px; overflow: hidden; }
    .card-cover img { width: 100%; height: 100%; object-fit: cover; }
    .card-badges { position: absolute; top: 10px; left: 10px; display: flex; gap: 6px; }
    .price-badge { background: rgba(0,0,0,0.65); color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; }
    .verified-badge { background: #1B4332; color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; }
    .verified-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .inactive-badge { background: #c62828; color: white; padding: 3px 10px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .card-top h3 { margin: 0 0 4px; font-size: 1.05rem; color: #1a1a1a; }
    .address-text { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.82rem; margin: 0; }
    .address-text mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .rating-pill { display: flex; align-items: center; gap: 4px; background: #f9f9f9; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
    .rating-pill mat-icon { color: #f59e0b; font-size: 16px; width: 16px; height: 16px; }
    .rating-pill small { color: #999; font-size: 0.78rem; }
    .cuisine-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .cuisine-chip { background: #e8f5e9; color: #1B4332; padding: 2px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
    .stats-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat { display: flex; align-items: center; gap: 4px; color: #666; font-size: 0.82rem; }
    .stat mat-icon { font-size: 15px; width: 15px; height: 15px; color: #1B4332; }
    .card-actions { display: flex; gap: 8px; padding: 8px 16px 16px; flex-wrap: wrap; }

    .empty-state { grid-column: 1/-1; text-align: center; padding: 80px; color: #999; }
    .empty-state mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ddd; display: block; margin: 0 auto 16px; }
    .empty-state h3 { color: #555; margin-bottom: 8px; }

    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } .hour-row { flex-wrap: wrap; } }
  `]
})
export class AdminRestaurantsComponent implements OnInit {
  restaurants: any[] = [];
  loadingList = true;
  showForm = false;
  editingId: string | null = null;
  saving = false;
  uploadingCover = false;
  uploadingGallery = false;
  coverPreview: string | null = null;
  galleryImages: string[] = [];
  isSuperAdmin$: Observable<boolean>;

  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  cuisineOptions = [
    'Italian', 'Indian', 'Chinese', 'Mexican', 'Mediterranean',
    'Japanese', 'Thai', 'Continental', 'Seafood', 'American',
    'Middle Eastern', 'French', 'Korean', 'Vietnamese', 'Spanish',
  ];

  featureOptions = [
    'WiFi', 'Parking', 'Outdoor Seating', 'Live Music', 'Bar',
    'Private Dining', 'Takeaway', 'Delivery', 'Valet Parking', 'Wheelchair Accessible',
  ];

  restaurantForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private store: Store,
  ) {
    this.isSuperAdmin$ = this.store.select(selectIsSuperAdmin);
    this.restaurantForm = this.buildForm();
  }

  ngOnInit() {
    this.loadRestaurants();
  }

  buildForm(): FormGroup {
    const hoursControls = this.days.map((day, i) =>
      this.fb.group({
        day: [day],
        open: ['09:00'],
        close: ['22:00'],
        isClosed: [i === 6], // Sunday closed by default
      })
    );

    return this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(1000)],
      cuisine: [[], Validators.required],
      priceRange: ['$$', Validators.required],
      phone: [''],
      email: ['', Validators.email],
      website: [''],
      features: [[]],
      reservationDuration: [90, [Validators.min(30), Validators.max(240)]],
      slotInterval: [30, [Validators.min(15), Validators.max(60)]],
      // Address
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['India'],
      latitude: [null],
      longitude: [null],
      // Hours
      operatingHours: this.fb.array(hoursControls),
    });
  }

  get operatingHoursArray(): FormArray {
    return this.restaurantForm.get('operatingHours') as FormArray;
  }

  loadRestaurants() {
    this.loadingList = true;
    this.http.get<any>(`${environment.apiUrl}/restaurants?limit=50`).subscribe({
      next: (res) => { this.restaurants = res.data.restaurants; this.loadingList = false; },
      error: () => this.loadingList = false,
    });
  }

  openForm(restaurant: any | null) {
    this.showForm = true;
    this.editingId = restaurant?._id || null;
    this.coverPreview = null;
    this.galleryImages = [];

    if (restaurant) {
      this.restaurantForm.patchValue({
        name: restaurant.name,
        description: restaurant.description,
        cuisine: restaurant.cuisine,
        priceRange: restaurant.priceRange,
        phone: restaurant.phone,
        email: restaurant.email,
        website: restaurant.website,
        features: restaurant.features || [],
        reservationDuration: restaurant.reservationDuration || 90,
        slotInterval: restaurant.slotInterval || 30,
        street: restaurant.address?.street,
        city: restaurant.address?.city,
        state: restaurant.address?.state,
        zip: restaurant.address?.zip,
        country: restaurant.address?.country || 'India',
        latitude: restaurant.address?.location?.coordinates?.[1],
        longitude: restaurant.address?.location?.coordinates?.[0],
      });

      // Patch hours
      if (restaurant.operatingHours?.length) {
        restaurant.operatingHours.forEach((h: any, i: number) => {
          this.operatingHoursArray.at(i)?.patchValue(h);
        });
      }

      this.coverPreview = restaurant.coverImage || null;
      this.galleryImages = restaurant.images || [];
    } else {
      this.restaurantForm = this.buildForm();
    }

    // Scroll to form
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
    this.restaurantForm = this.buildForm();
    this.coverPreview = null;
    this.galleryImages = [];
  }

  isFeatureSelected(feature: string): boolean {
    return (this.restaurantForm.get('features')?.value || []).includes(feature);
  }

  toggleFeature(feature: string, checked: boolean) {
    const current: string[] = this.restaurantForm.get('features')?.value || [];
    const updated = checked ? [...current, feature] : current.filter(f => f !== feature);
    this.restaurantForm.get('features')?.setValue(updated);
  }

  onClosedToggle(index: number, isClosed: boolean) {
    const group = this.operatingHoursArray.at(index);
    group.patchValue({ isClosed });
  }

  triggerUpload(type: 'cover' | 'gallery') {
    const el = document.querySelector(type === 'cover' ? 'input[type=file]:nth-of-type(1)' : 'input[type=file]:nth-of-type(2)') as HTMLInputElement;
    el?.click();
  }

  onImageSelected(event: Event, type: 'cover' | 'gallery') {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    if (type === 'cover') {
      this.uploadingCover = true;
      // Show local preview immediately
      const reader = new FileReader();
      reader.onload = (e) => this.coverPreview = e.target?.result as string;
      reader.readAsDataURL(file);
    } else {
      this.uploadingGallery = true;
    }

    this.http.post<any>(`${environment.apiUrl}/upload/image`, formData).subscribe({
      next: (res) => {
        if (type === 'cover') {
          this.coverPreview = res.data.url;
          this.uploadingCover = false;
        } else {
          this.galleryImages.push(res.data.url);
          this.uploadingGallery = false;
        }
        this.snackBar.open('Image uploaded!', 'Close', { duration: 2000 });
      },
      error: (err) => {
        // Fallback: use base64 preview if no Cloudinary configured
        if (type === 'cover') {
          this.uploadingCover = false;
          // coverPreview already set from FileReader above
        } else {
          this.uploadingGallery = false;
          const reader = new FileReader();
          reader.onload = (e) => this.galleryImages.push(e.target?.result as string);
          reader.readAsDataURL(file);
        }
        this.snackBar.open('Saved locally (configure Cloudinary for cloud storage)', 'Close', { duration: 3000 });
      },
    });

    // Reset input so same file can be re-selected
    (event.target as HTMLInputElement).value = '';
  }

  removeGalleryImage(index: number) {
    this.galleryImages.splice(index, 1);
  }

  saveRestaurant() {
    if (this.restaurantForm.invalid) {
      this.restaurantForm.markAllAsTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.saving = true;
    const v = this.restaurantForm.value;

    const payload: any = {
      name: v.name,
      description: v.description,
      cuisine: v.cuisine,
      priceRange: v.priceRange,
      phone: v.phone,
      email: v.email,
      website: v.website,
      features: v.features,
      reservationDuration: v.reservationDuration,
      slotInterval: v.slotInterval,
      operatingHours: v.operatingHours,
      address: {
        street: v.street,
        city: v.city,
        state: v.state,
        zip: v.zip,
        country: v.country,
      },
      coverImage: this.coverPreview,
      images: this.galleryImages,
    };

    // Add coordinates if provided
    if (v.latitude && v.longitude) {
      payload.address.location = {
        type: 'Point',
        coordinates: [parseFloat(v.longitude), parseFloat(v.latitude)],
      };
    }

    const req = this.editingId
      ? this.http.put<any>(`${environment.apiUrl}/restaurants/${this.editingId}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/restaurants`, payload);

    req.subscribe({
      next: (res) => {
        const saved = res.data.restaurant;
        if (this.editingId) {
          const idx = this.restaurants.findIndex(r => r._id === this.editingId);
          if (idx >= 0) this.restaurants[idx] = saved;
        } else {
          this.restaurants.unshift(saved);
        }
        this.saving = false;
        this.closeForm();
        this.snackBar.open(
          `Restaurant ${this.editingId ? 'updated' : 'created'} successfully!`,
          'Close', { duration: 3000, panelClass: 'snack-success' }
        );
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save restaurant', 'Close', { duration: 4000 });
      },
    });
  }

  toggleRestaurantActive(restaurant: any) {
    const action = restaurant.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} "${restaurant.name}"?`)) return;

    restaurant.isActive = !restaurant.isActive; // optimistic

    this.http.put<any>(`${environment.apiUrl}/restaurants/${restaurant._id}`, { isActive: restaurant.isActive }).subscribe({
      next: () => {
        this.snackBar.open(
          `"${restaurant.name}" ${restaurant.isActive ? 'activated' : 'deactivated'}`,
          'Close', { duration: 3000 }
        );
      },
      error: () => {
        restaurant.isActive = !restaurant.isActive; // revert
        this.snackBar.open('Failed to update status', 'Close', { duration: 3000 });
      },
    });
  }

  deleteRestaurant(restaurant: any) {
    if (!confirm(`⚠️ Permanently delete "${restaurant.name}"?\n\nThis will deactivate the restaurant and cannot be undone.`)) return;

    this.http.delete(`${environment.apiUrl}/restaurants/${restaurant._id}`).subscribe({
      next: () => {
        this.restaurants = this.restaurants.filter(r => r._id !== restaurant._id);
        this.snackBar.open(`"${restaurant.name}" deleted`, 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }
}
