import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Store } from '@ngrx/store';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-tables',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><mat-icon>table_restaurant</mat-icon> Table Management</h1>
        <a mat-button routerLink="/admin"><mat-icon>arrow_back</mat-icon> Dashboard</a>
      </div>

      <div class="content-grid">
        <!-- Add Table Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-card-title>{{ editingTable ? 'Edit Table' : 'Add New Table' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="tableForm" (ngSubmit)="saveTable()" class="table-form">
              <mat-form-field appearance="outline">
                <mat-label>Table Number</mat-label>
                <input matInput formControlName="tableNumber" placeholder="T01">
                <mat-error *ngIf="tableForm.get('tableNumber')?.hasError('required')">Required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Capacity</mat-label>
                <input matInput type="number" formControlName="capacity" min="1" max="20">
                <mat-error *ngIf="tableForm.get('capacity')?.hasError('required')">Required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Section</mat-label>
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
                <mat-label>Features</mat-label>
                <mat-select formControlName="features" multiple>
                  <mat-option *ngFor="let f of tableFeatures" [value]="f">{{ f }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="tableForm.invalid || saving">
                  {{ saving ? 'Saving...' : (editingTable ? 'Update Table' : 'Add Table') }}
                </button>
                <button mat-stroked-button type="button" *ngIf="editingTable" (click)="cancelEdit()">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Table List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-card-title>Tables ({{ tables.length }} total)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading" class="loading-center"><mat-spinner diameter="36"></mat-spinner></div>

            <div class="tables-grid" *ngIf="!loading">
              <div class="table-item" *ngFor="let t of tables" [class.inactive]="!t.isActive">
                <div class="table-visual" [class]="'shape-' + t.shape + ' section-' + t.section.toLowerCase()">
                  <mat-icon>table_restaurant</mat-icon>
                  <span>{{ t.tableNumber }}</span>
                </div>
                <div class="table-info">
                  <strong>{{ t.tableNumber }}</strong>
                  <div class="table-meta">
                    <span><mat-icon>group</mat-icon> {{ t.capacity }} seats</span>
                    <span><mat-icon>room</mat-icon> {{ t.section }}</span>
                  </div>
                  <div class="table-chips">
                    <span class="mini-chip" *ngFor="let f of t.features">{{ f }}</span>
                  </div>
                  <span class="status-dot" [class]="'status-' + t.status">{{ t.status }}</span>
                </div>
                <div class="table-actions">
                  <button mat-icon-button (click)="editTable(t)" title="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteTable(t)" title="Delete" *ngIf="t.isActive">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>

              <div class="empty-state" *ngIf="tables.length === 0">
                <mat-icon>table_restaurant</mat-icon>
                <p>No tables yet. Add your first table!</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; color: #1B4332; margin: 0; font-size: 1.6rem; }
    .content-grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; }
    .form-card, .list-card { border-radius: 12px; }
    .form-card { position: sticky; top: 80px; align-self: start; }
    .table-form { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; gap: 12px; }
    .loading-center { display: flex; justify-content: center; padding: 40px; }
    .tables-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .table-item { display: flex; gap: 12px; padding: 12px; border: 1px solid #eee; border-radius: 10px; transition: all 0.2s; }
    .table-item:hover { border-color: #1B4332; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .table-item.inactive { opacity: 0.5; }
    .table-visual { width: 50px; height: 50px; border-radius: 8px; background: #e8f5e9; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .table-visual mat-icon { color: #1B4332; font-size: 20px; width: 20px; height: 20px; }
    .table-visual span { font-size: 0.65rem; color: #1B4332; font-weight: 700; }
    .section-outdoor .table-visual { background: #e3f2fd; }
    .section-private .table-visual { background: #fce4ec; }
    .section-bar .table-visual { background: #fff3e0; }
    .table-info { flex: 1; }
    .table-info strong { font-size: 0.95rem; display: block; margin-bottom: 4px; }
    .table-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
    .table-meta span { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #666; }
    .table-meta mat-icon { font-size: 14px; width: 14px; height: 14px; color: #1B4332; }
    .table-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
    .mini-chip { background: #f0f0f0; padding: 1px 6px; border-radius: 8px; font-size: 0.7rem; }
    .status-dot { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
    .status-available { background: #e8f5e9; color: #2e7d32; }
    .status-occupied { background: #ffebee; color: #c62828; }
    .status-reserved { background: #fff8e1; color: #f57f17; }
    .status-maintenance { background: #f5f5f5; color: #666; }
    .table-actions { display: flex; flex-direction: column; justify-content: center; }
    .empty-state { grid-column: 1/-1; text-align: center; padding: 40px; color: #999; }
    .empty-state mat-icon { font-size: 60px; width: 60px; height: 60px; color: #ddd; display: block; margin: 0 auto 12px; }
    @media (max-width: 900px) { .content-grid { grid-template-columns: 1fr; } .form-card { position: static; } }
  `]
})
export class AdminTablesComponent implements OnInit {
  tables: any[] = [];
  loading = true;
  saving = false;
  editingTable: any = null;
  tableForm: FormGroup;
  restaurantId = '';

  sections = ['Indoor', 'Outdoor', 'Bar', 'Private', 'Rooftop', 'Garden'];
  tableFeatures = ['Window View', 'Corner', 'Booth', 'High Chair', 'Wheelchair Accessible', 'Romantic', 'Private'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private store: Store,
  ) {
    this.tableForm = this.fb.group({
      tableNumber: ['', Validators.required],
      capacity: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      section: ['Indoor', Validators.required],
      shape: ['square'],
      features: [[]],
    });
  }

  ngOnInit() {
    this.store.select(selectCurrentUser).subscribe((user) => {
      if (user?.restaurantId) {
        this.restaurantId = user.restaurantId;
        this.loadTables();
      }
    });
  }

  loadTables() {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/tables/${this.restaurantId}`).subscribe({
      next: (res) => { this.tables = res.data.tables; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  saveTable() {
    if (this.tableForm.invalid) return;
    this.saving = true;

    const data = { ...this.tableForm.value, restaurant: this.restaurantId };

    const req = this.editingTable
      ? this.http.patch<any>(`${environment.apiUrl}/tables/${this.editingTable._id}`, data)
      : this.http.post<any>(`${environment.apiUrl}/tables`, data);

    req.subscribe({
      next: (res) => {
        if (this.editingTable) {
          const idx = this.tables.findIndex(t => t._id === this.editingTable._id);
          if (idx >= 0) this.tables[idx] = res.data.table;
        } else {
          this.tables.push(res.data.table);
        }
        this.tableForm.reset({ capacity: 4, section: 'Indoor', shape: 'square', features: [] });
        this.editingTable = null;
        this.saving = false;
        this.snackBar.open('Table saved successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to save', 'Close', { duration: 3000 });
      },
    });
  }

  editTable(table: any) {
    this.editingTable = table;
    this.tableForm.patchValue({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      section: table.section,
      shape: table.shape,
      features: table.features,
    });
  }

  cancelEdit() {
    this.editingTable = null;
    this.tableForm.reset({ capacity: 4, section: 'Indoor', shape: 'square', features: [] });
  }

  deleteTable(table: any) {
    if (!confirm(`Delete Table ${table.tableNumber}?`)) return;
    this.http.delete(`${environment.apiUrl}/tables/${table._id}`).subscribe({
      next: () => {
        this.tables = this.tables.filter(t => t._id !== table._id);
        this.snackBar.open('Table deleted', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to delete', 'Close', { duration: 3000 }),
    });
  }
}
