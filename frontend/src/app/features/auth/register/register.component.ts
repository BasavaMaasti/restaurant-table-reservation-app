import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthActions } from '../../../store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../store/auth/auth.selectors';

function passwordMatchValidator(control: AbstractControl) {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-header">
            <mat-icon class="auth-icon">restaurant</mat-icon>
            <h2>Create Account</h2>
            <p>Join TableBook today — it's free!</p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="error-alert" *ngIf="error$ | async as error">
            <mat-icon>error</mat-icon> {{ error }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="name" placeholder="John Doe">
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
              <mat-error *ngIf="form.get('name')?.hasError('minlength')">Name must be at least 2 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone (Optional)</mat-label>
              <input matInput formControlName="phone" placeholder="+91-XXXXXXXXXX">
              <mat-icon matPrefix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePass ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePass = !hidePass">
                <mat-icon>{{ hidePass ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
              <mat-error *ngIf="form.get('password')?.hasError('minlength')">At least 8 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="hideConfirm ? 'password' : 'text'" formControlName="confirmPassword">
              <mat-icon matPrefix>lock_reset</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hideConfirm = !hideConfirm">
                <mat-icon>{{ hideConfirm ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('confirmPassword')?.hasError('mismatch')">Passwords do not match</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" class="submit-btn"
              [disabled]="form.invalid || (loading$ | async)">
              <mat-spinner *ngIf="loading$ | async" diameter="20"></mat-spinner>
              <span *ngIf="!(loading$ | async)">Create Account</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer>
          <p class="auth-footer">
            Already have an account? <a routerLink="/auth/login">Sign in</a>
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1B4332 0%, #40916C 100%); padding: 20px; }
    .auth-card { width: 100%; max-width: 440px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .auth-header { text-align: center; padding: 20px 0; width: 100%; }
    .auth-icon { font-size: 48px; width: 48px; height: 48px; color: #1B4332; }
    .auth-header h2 { margin: 8px 0 4px; font-size: 1.6rem; color: #1B4332; }
    .auth-header p { color: #666; margin: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
    mat-form-field { width: 100%; }
    .submit-btn { width: 100%; height: 48px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .error-alert { background: #ffebee; color: #c62828; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .auth-footer { text-align: center; padding: 16px; color: #666; margin: 0; }
    .auth-footer a { color: #1B4332; font-weight: 600; }
  `]
})
export class RegisterComponent {
  form: FormGroup;
  hidePass = true;
  hideConfirm = true;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private fb: FormBuilder, private store: Store) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });

    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  onSubmit() {
    if (this.form.valid) {
      const { name, email, password, phone } = this.form.value;
      this.store.dispatch(AuthActions.register({ name, email, password, phone }));
    }
  }
}
