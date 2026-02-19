import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../core/models/user.model';
import { AuthActions } from '../../store/auth/auth.actions';
import { selectCurrentUser, selectAuthLoading } from '../../store/auth/auth.selectors';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatTabsModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1><mat-icon>account_circle</mat-icon> My Profile</h1>
      </div>

      <div *ngIf="user$ | async as user" class="profile-grid">
        <!-- Avatar Card -->
        <mat-card class="avatar-card">
          <div class="avatar-circle">{{ user.name?.charAt(0)?.toUpperCase() }}</div>
          <h2>{{ user.name }}</h2>
          <p>{{ user.email }}</p>
          <div class="role-badge" [class]="'role-' + user.role">{{ user.role | titlecase }}</div>
          <div class="member-since">Member since {{ user.createdAt | date:'MMMM y' }}</div>
        </mat-card>

        <!-- Settings -->
        <div class="settings-column">
          <mat-tab-group>
            <!-- Profile Tab -->
            <mat-tab label="Profile Settings">
              <div class="tab-content">
                <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="settings-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="name">
                    <mat-icon matPrefix>person</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phone">
                    <mat-icon matPrefix>phone</mat-icon>
                  </mat-form-field>

                  <div class="section-label">Cuisine Preferences</div>
                  <mat-form-field appearance="outline">
                    <mat-select formControlName="cuisines" multiple>
                      <mat-option *ngFor="let c of cuisines" [value]="c">{{ c }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="section-label">Dietary Restrictions</div>
                  <mat-form-field appearance="outline">
                    <mat-select formControlName="dietaryRestrictions" multiple>
                      <mat-option *ngFor="let d of dietaryOptions" [value]="d">{{ d }}</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <button mat-raised-button color="primary" type="submit" [disabled]="loading$ | async">
                    <mat-spinner *ngIf="loading$ | async" diameter="20"></mat-spinner>
                    <span *ngIf="!(loading$ | async)">Save Changes</span>
                  </button>
                </form>
              </div>
            </mat-tab>

            <!-- Password Tab -->
            <mat-tab label="Change Password">
              <div class="tab-content">
                <div *ngIf="passwordSuccess" class="success-banner">
                  <mat-icon>check_circle</mat-icon> Password changed successfully!
                </div>
                <div *ngIf="passwordError" class="error-banner">
                  <mat-icon>error</mat-icon> {{ passwordError }}
                </div>
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="settings-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Current Password</mat-label>
                    <input matInput type="password" formControlName="currentPassword">
                    <mat-icon matPrefix>lock</mat-icon>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>New Password</mat-label>
                    <input matInput type="password" formControlName="newPassword">
                    <mat-icon matPrefix>lock_open</mat-icon>
                    <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">At least 8 characters</mat-error>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Confirm New Password</mat-label>
                    <input matInput type="password" formControlName="confirmPassword">
                    <mat-icon matPrefix>lock_reset</mat-icon>
                  </mat-form-field>
                  <button mat-raised-button color="primary" type="submit" [disabled]="passwordForm.invalid || changingPassword">
                    {{ changingPassword ? 'Changing...' : 'Change Password' }}
                  </button>
                </form>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 32px 24px; }
    .page-header { margin-bottom: 32px; }
    .page-header h1 { display: flex; align-items: center; gap: 12px; font-size: 1.8rem; color: #1B4332; margin: 0; }
    .profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; }
    .avatar-card { border-radius: 16px; text-align: center; padding: 32px 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .avatar-circle { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #1B4332, #40916C); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; }
    .avatar-card h2 { margin: 4px 0 0; font-size: 1.3rem; }
    .avatar-card p { color: #666; margin: 0; font-size: 0.9rem; }
    .role-badge { padding: 4px 16px; border-radius: 16px; font-size: 0.85rem; font-weight: 600; margin-top: 4px; }
    .role-customer { background: #e8f5e9; color: #2e7d32; }
    .role-admin { background: #e3f2fd; color: #1565c0; }
    .role-super_admin { background: #fce4ec; color: #880e4f; }
    .member-since { color: #999; font-size: 0.8rem; margin-top: 8px; }
    .tab-content { padding: 24px 0; }
    .settings-form { display: flex; flex-direction: column; gap: 16px; max-width: 500px; }
    mat-form-field { width: 100%; }
    .section-label { font-weight: 600; color: #444; font-size: 0.9rem; margin-bottom: -8px; }
    .success-banner { background: #e8f5e9; color: #2e7d32; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .error-banner { background: #ffebee; color: #c62828; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    @media (max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProfileComponent implements OnInit {
  user$: Observable<User | null>;
  loading$: Observable<boolean>;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  changingPassword = false;
  passwordSuccess = false;
  passwordError = '';

  cuisines = ['Italian', 'Indian', 'Chinese', 'Mexican', 'Mediterranean', 'Japanese', 'Thai', 'Continental', 'Seafood'];
  dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free', 'Dairy-Free'];

  constructor(private store: Store, private fb: FormBuilder, private authService: AuthService, private snackBar: MatSnackBar) {
    this.user$ = this.store.select(selectCurrentUser);
    this.loading$ = this.store.select(selectAuthLoading);

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: [''],
      cuisines: [[]],
      dietaryRestrictions: [[]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.user$.subscribe((user) => {
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone,
          cuisines: user.preferences?.cuisine || [],
          dietaryRestrictions: user.preferences?.dietaryRestrictions || [],
        });
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    const { name, phone, cuisines, dietaryRestrictions } = this.profileForm.value;
    this.store.dispatch(AuthActions.updateProfile({
      data: { name, phone, preferences: { cuisine: cuisines, dietaryRestrictions } },
    }));
    this.snackBar.open('Profile updated!', 'Close', { duration: 3000 });
  }

  changePassword() {
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    this.changingPassword = true;
    this.passwordError = '';
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Failed to change password';
        this.changingPassword = false;
      },
    });
  }
}
