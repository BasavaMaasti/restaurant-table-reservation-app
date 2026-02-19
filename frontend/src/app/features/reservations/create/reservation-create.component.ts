import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reservation-create',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="redirect-container">
      <mat-icon>restaurant</mat-icon>
      <h2>Make a Reservation</h2>
      <p>Browse our restaurants and pick a table directly from the restaurant page.</p>
      <a mat-raised-button color="primary" routerLink="/restaurants">Browse Restaurants</a>
    </div>
  `,
  styles: [`
    .redirect-container { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; text-align: center; }
    mat-icon { font-size: 80px; width: 80px; height: 80px; color: #1B4332; }
    h2 { color: #1B4332; font-size: 1.8rem; }
    p { color: #666; max-width: 400px; line-height: 1.6; }
  `]
})
export class ReservationCreateComponent {}
