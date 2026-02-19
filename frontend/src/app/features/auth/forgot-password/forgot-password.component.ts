import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <mat-card-header>
          <div class="auth-header">
            <mat-icon>lock_reset</mat-icon>
            <h2>Forgot Password</h2>
            <p>Enter your email to receive a reset link</p>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="success" class="success-alert">
            <mat-icon>check_circle</mat-icon> Reset link sent! Check your email.
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!success">
            <mat-form-field appearance="outline" style="width:100%">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-icon matPrefix>email</mat-icon>
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" style="width:100%;margin-top:16px;height:48px" [disabled]="form.invalid || loading">
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
        </mat-card-content>
        <mat-card-footer>
          <p style="text-align:center;padding:16px;color:#666"><a routerLink="/auth/login" style="color:#1B4332">Back to Login</a></p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #1B4332, #40916C); padding: 20px; }
    .auth-card { width: 100%; max-width: 400px; border-radius: 16px; }
    .auth-header { text-align: center; padding: 20px 0; width: 100%; }
    .auth-header mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1B4332; }
    .auth-header h2 { margin: 8px 0 4px; color: #1B4332; }
    .success-alert { background: #e8f5e9; color: #2e7d32; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; gap: 8px; }
  `]
})
export class ForgotPasswordComponent {
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  loading = false;
  success = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  onSubmit() {
    if (this.form.valid) {
      this.loading = true;
      this.authService.forgotPassword(this.form.value.email!).subscribe({
        next: () => { this.success = true; this.loading = false; },
        error: () => { this.loading = false; },
      });
    }
  }
}
