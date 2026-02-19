import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-header">
            <mat-icon class="auth-icon">restaurant</mat-icon>
            <h2>Welcome Back</h2>
            <p>Sign in to your TableBook account</p>
          </div>
        </mat-card-header>

        <mat-card-content>
          <div class="error-alert" *ngIf="error$ | async as error">
            <mat-icon>error</mat-icon> {{ error }}
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="you@example.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility' : 'visibility_off' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <div class="forgot-link">
              <a routerLink="/auth/forgot-password">Forgot your password?</a>
            </div>

            <button mat-raised-button color="primary" type="submit" class="submit-btn"
              [disabled]="form.invalid || (loading$ | async)">
              <mat-spinner *ngIf="loading$ | async" diameter="20"></mat-spinner>
              <span *ngIf="!(loading$ | async)">Sign In</span>
            </button>
          </form>

          <div class="demo-accounts">
            <p><strong>Demo Accounts:</strong></p>
            <button mat-stroked-button (click)="fillDemo('customer')">Customer Demo</button>
            <button mat-stroked-button (click)="fillDemo('admin')">Admin Demo</button>
          </div>
        </mat-card-content>

        <mat-card-footer>
          <p class="auth-footer">
            Don't have an account? <a routerLink="/auth/register">Create one</a>
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1B4332 0%, #40916C 100%); padding: 20px; }
    .auth-card { width: 100%; max-width: 420px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .auth-header { text-align: center; padding: 20px 0; width: 100%; }
    .auth-icon { font-size: 48px; width: 48px; height: 48px; color: #1B4332; }
    .auth-header h2 { margin: 8px 0 4px; font-size: 1.6rem; color: #1B4332; }
    .auth-header p { color: #666; margin: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
    mat-form-field { width: 100%; }
    .forgot-link { text-align: right; margin-top: -8px; }
    .forgot-link a { color: #1B4332; font-size: 0.85rem; }
    .submit-btn { width: 100%; height: 48px; font-size: 1rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .error-alert { background: #ffebee; color: #c62828; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .demo-accounts { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; }
    .demo-accounts p { font-size: 0.85rem; color: #666; margin-bottom: 8px; }
    .demo-accounts { display: flex; flex-direction: column; gap: 8px; }
    .auth-footer { text-align: center; padding: 16px; color: #666; margin: 0; }
    .auth-footer a { color: #1B4332; font-weight: 600; }
  `]
})
export class LoginComponent {
  form: FormGroup;
  hidePassword = true;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private fb: FormBuilder, private store: Store) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.loading$ = this.store.select(selectAuthLoading);
    this.error$ = this.store.select(selectAuthError);
  }

  onSubmit() {
    if (this.form.valid) {
      const { email, password } = this.form.value;
      this.store.dispatch(AuthActions.login({ email, password }));
    }
  }

  fillDemo(type: 'customer' | 'admin') {
    const creds = type === 'admin'
      ? { email: 'admin@restaurant.com', password: 'Password123!' }
      : { email: 'john@example.com', password: 'Password123!' };
    this.form.patchValue(creds);
  }
}
