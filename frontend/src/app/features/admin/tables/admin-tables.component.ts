import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><mat-icon>table_restaurant</mat-icon> Table Management</h1>
        <a mat-button routerLink="/admin"><mat-icon>arrow_back</mat-icon> Dashboard</a>
      </div>

      <!-- Step 1: Pick a Restaurant -->
      <mat-card class="restaurant-picker">
        <mat-card-content>
          <div class="picker-row">
            <mat-icon class="picker-icon">store</mat-icon>
            <mat-form-field appearance="outline" class="restaurant-select">
              <mat-label>Select Restaurant to Manage Tables</mat-label>
              <mat-select [(value)]="selectedRestaurantId" (selectionChange)="onRestaurantChange($event.value)">
                <mat-option *ngFor="let r of restaurants" [value]="r._id">
                  {{ r.name }} — {{ r.address?.city }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            <div class="loading-inline" *ngIf="loadingRestaurants">
              <mat-spinner diameter="24"></mat-spinner>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- No restaurant selected -->
      <div class="empty-picker" *ngIf="!selectedRestaurantId && !loadingRestaurants">
        <mat-icon>arrow_upward</mat-icon>
        <p>Select a restaurant above to view and manage its tables</p>
      </div>

      <!-- Main Content -->
      <div class="content-grid" *ngIf="selectedRestaurantId">

        <!-- Add / Edit Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ editingTable ? 'Edit Table' : 'Add New Table' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="tableForm" (ngSubmit)="saveTable()" class="table-form">

              <mat-form-field appearance="outline">
                <mat-label>Table Number *</mat-label>
                <input matInput formControlName="tableNumber" placeholder="T01, A2, VIP-1...">
                <mat-error>Required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Capacity (seats) *</mat-label>
                <input matInput type="number" formControlName="capacity" min="1" max="20">
                <mat-error>1–20 required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Section *</mat-label>
                <mat-select formControlName="section">
                  <mat-option *ngFor="let s of sections" [value]="s">{{ s }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Shape</mat-label>
                <mat-select formControlName="shape">
                  <mat-option value="round">Round</mat-option>
                  <mat-option value="square">Square</mat-option>
                  <mat-option value="rectangle">Rectangle</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Special Features</mat-label>
                <mat-select formControlName="features" multiple>
                  <mat-option *ngFor="let f of tableFeatures" [value]="f">{{ f }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit"
                  [disabled]="tableForm.invalid || saving">
                  <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
                  <mat-icon *ngIf="!saving">{{ editingTable ? 'save' : 'add' }}</mat-icon>
                  {{ saving ? 'Saving...' : (editingTable ? 'Update Table' : 'Add Table') }}
                </button>
                <button mat-stroked-button type="button" *ngIf="editingTable" (click)="cancelEdit()">
                  <mat-icon>close</mat-icon> Cancel
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Table List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>
              Tables
              <span class="count-badge">{{ tables.length }} total</span>
              <span class="count-badge capacity-badge" *ngIf="tables.length">
                {{ totalCapacity }} seats
              </span>
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="loading-center" *ngIf="loadingTables">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Loading tables...</p>
            </div>

            <ng-container *ngIf="!loadingTables">
              <div *ngFor="let section of getSections()" class="section-group">
                <div class="section-header">
                  {{ section }} ({{ getTablesBySection(section).length }})
                </div>
                <div class="tables-grid">
                  <div class="table-item"
                    *ngFor="let t of getTablesBySection(section)"
                    [class.inactive]="!t.isActive"
                    [class.editing]="editingTable?._id === t._id">

                    <div class="table-visual" [class]="'section-bg-' + t.section?.toLowerCase()">
                      <mat-icon>table_restaurant</mat-icon>
                      <span class="table-num">{{ t.tableNumber }}</span>
                    </div>

                    <div class="table-details">
                      <div class="detail-row"><mat-icon>group</mat-icon> {{ t.capacity }} seats</div>
                      <div class="detail-row"><mat-icon>category</mat-icon> {{ t.shape }}</div>
                      <div class="features-wrap" *ngIf="t.features?.length">
                        <span class="feat-chip" *ngFor="let f of t.features">{{ f }}</span>
                      </div>
                      <span class="status-dot" [class]="'status-' + t.status">{{ t.status }}</span>
                    </div>

                    <div class="table-actions">
                      <button mat-icon-button (click)="editTable(t)" matTooltip="Edit">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="warn" (click)="deleteTable(t)"
                        matTooltip="Delete" *ngIf="t.isActive">
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="empty-state" *ngIf="tables.length === 0">
                <mat-icon>table_restaurant</mat-icon>
                <p>No tables yet for this restaurant.</p>
                <p class="hint">Use the form on the left to add your first table.</p>
              </div>
            </ng-container>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1300px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; color: #1B4332; margin: 0; font-size: 1.6rem; }

    .restaurant-picker { border-radius: 12px; margin-bottom: 24px; border-left: 4px solid #1B4332; }
    .picker-row { display: flex; align-items: center; gap: 16px; padding: 4px 0; }
    .picker-icon { color: #1B4332; font-size: 28px; width: 28px; height: 28px; }
    .restaurant-select { flex: 1; max-width: 500px; }
    .loading-inline { display: flex; align-items: center; }

    .empty-picker { text-align: center; padding: 60px; color: #aaa; }
    .empty-picker mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ddd; display: block; margin: 0 auto 12px; }

    .content-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }

    .form-card { border-radius: 12px; align-self: start; position: sticky; top: 80px; }
    .table-form { display: flex; flex-direction: column; gap: 14px; padding: 8px 0; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; gap: 10px; }
    .form-actions button { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; }

    .list-card { border-radius: 12px; }
    mat-card-title { display: flex; align-items: center; gap: 10px; }
    .count-badge { background: #e8f5e9; color: #1B4332; font-size: 0.78rem; font-weight: 700; padding: 2px 10px; border-radius: 12px; }
    .capacity-badge { background: #e3f2fd; color: #1565c0; }

    .loading-center { display: flex; flex-direction: column; align-items: center; padding: 48px; gap: 16px; color: #666; }

    .section-group { margin-bottom: 24px; }
    .section-header { font-weight: 700; color: #1B4332; font-size: 0.95rem; padding: 8px 0; border-bottom: 2px solid #e8f5e9; margin-bottom: 12px; }

    .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
    .table-item { display: flex; flex-direction: column; border: 2px solid #eee; border-radius: 12px; padding: 12px; transition: all 0.2s; gap: 8px; }
    .table-item:hover { border-color: #40916C; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .table-item.inactive { opacity: 0.4; background: #f5f5f5; }
    .table-item.editing { border-color: #1B4332; background: #f1faf5; box-shadow: 0 0 0 3px rgba(27,67,50,0.15); }

    .table-visual { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 60px; border-radius: 10px; }
    .table-visual mat-icon { color: #1B4332; font-size: 24px; width: 24px; height: 24px; }
    .table-num { font-weight: 800; font-size: 0.85rem; color: #1B4332; }

    .section-bg-indoor { background: #e8f5e9; }
    .section-bg-outdoor { background: #e3f2fd; }
    .section-bg-bar { background: #fff3e0; }
    .section-bg-private { background: #fce4ec; }
    .section-bg-rooftop { background: #f3e5f5; }
    .section-bg-garden { background: #dcedc8; }

    .table-details { flex: 1; }
    .detail-row { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #555; margin-bottom: 4px; }
    .detail-row mat-icon { font-size: 14px; width: 14px; height: 14px; color: #1B4332; }
    .features-wrap { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .feat-chip { background: #f0f0f0; padding: 1px 7px; border-radius: 8px; font-size: 0.7rem; color: #555; }

    .status-dot { display: inline-block; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; padding: 2px 8px; border-radius: 10px; margin-top: 4px; }
    .status-available { background: #e8f5e9; color: #2e7d32; }
    .status-occupied { background: #ffebee; color: #c62828; }
    .status-reserved { background: #fff8e1; color: #f57f17; }
    .status-maintenance { background: #f5f5f5; color: #888; }

    .table-actions { display: flex; justify-content: flex-end; gap: 4px; }

    .empty-state { text-align: center; padding: 60px 20px; color: #aaa; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #ddd; display: block; margin: 0 auto 12px; }
    .hint { font-size: 0.85rem; color: #bbb; }

    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .form-card { position: static; } }
  `]
})
export class AdminTablesComponent implements OnInit {
  restaurants: any[] = [];
  selectedRestaurantId = '';
  loadingRestaurants = true;

  tables: any[] = [];
  loadingTables = false;
  saving = false;
  editingTable: any = null;
  tableForm: FormGroup;

  sections = ['Indoor', 'Outdoor', 'Bar', 'Private', 'Rooftop', 'Garden'];
  tableFeatures = ['Window View', 'Corner', 'Booth', 'Romantic', 'Private', 'High Chair', 'Wheelchair Accessible'];

  constructor(private fb: FormBuilder, private http: HttpClient, private snackBar: MatSnackBar) {
    this.tableForm = this.buildForm();
  }

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/restaurants?limit=100`).subscribe({
      next: (res) => {
        this.restaurants = res.data.restaurants;
        this.loadingRestaurants = false;
        if (this.restaurants.length === 1) {
          this.selectedRestaurantId = this.restaurants[0]._id;
          this.loadTables();
        }
      },
      error: () => { this.loadingRestaurants = false; },
    });
  }

  buildForm(): FormGroup {
    return this.fb.group({
      tableNumber: ['', Validators.required],
      capacity: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      section: ['Indoor', Validators.required],
      shape: ['square'],
      features: [[]],
    });
  }

  onRestaurantChange(id: string) {
    this.selectedRestaurantId = id;
    this.tables = [];
    this.editingTable = null;
    this.tableForm = this.buildForm();
    this.loadTables();
  }

  loadTables() {
    if (!this.selectedRestaurantId) return;
    this.loadingTables = true;
    this.http.get<any>(`${environment.apiUrl}/tables/${this.selectedRestaurantId}`).subscribe({
      next: (res) => { this.tables = res.data.tables || []; this.loadingTables = false; },
      error: (err) => { this.loadingTables = false; this.snackBar.open(err.error?.message || 'Failed to load tables', 'Close', { duration: 3000 }); },
    });
  }

  saveTable() {
    if (this.tableForm.invalid) return;
    this.saving = true;
    const data = { ...this.tableForm.value, restaurant: this.selectedRestaurantId };
    const req = this.editingTable
      ? this.http.patch<any>(`${environment.apiUrl}/tables/${this.editingTable._id}`, data)
      : this.http.post<any>(`${environment.apiUrl}/tables`, data);

    req.subscribe({
      next: (res) => {
        const saved = res.data.table;
        if (this.editingTable) {
          const idx = this.tables.findIndex(t => t._id === this.editingTable._id);
          if (idx >= 0) this.tables[idx] = saved;
        } else {
          this.tables.push(saved);
        }
        this.cancelEdit();
        this.saving = false;
        this.snackBar.open(`Table ${saved.tableNumber} ${this.editingTable ? 'updated' : 'added'}!`, 'Close', { duration: 3000 });
      },
      error: (err) => { this.saving = false; this.snackBar.open(err.error?.message || 'Failed to save', 'Close', { duration: 3000 }); },
    });
  }

  editTable(table: any) {
    this.editingTable = table;
    this.tableForm.patchValue({ tableNumber: table.tableNumber, capacity: table.capacity, section: table.section, shape: table.shape || 'square', features: table.features || [] });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingTable = null;
    this.tableForm = this.buildForm();
  }

  deleteTable(table: any) {
    if (!confirm(`Delete Table ${table.tableNumber}?`)) return;
    this.http.delete<any>(`${environment.apiUrl}/tables/${table._id}`).subscribe({
      next: () => { this.tables = this.tables.filter(t => t._id !== table._id); this.snackBar.open(`Table ${table.tableNumber} deleted`, 'Close', { duration: 3000 }); },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }

  get totalCapacity(): number {
    return this.tables.reduce((sum, t) => sum + (t.capacity || 0), 0);
  }

  getSections(): string[] {
    return [...new Set(this.tables.map(t => t.section))].sort();
  }

  getTablesBySection(section: string): any[] {
    return this.tables.filter(t => t.section === section);
  }
}
