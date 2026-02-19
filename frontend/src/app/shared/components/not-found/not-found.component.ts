import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found">
      <mat-icon>search_off</mat-icon>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist.</p>
      <a mat-raised-button color="primary" routerLink="/restaurants">Go Home</a>
    </div>
  `,
  styles: [`
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; text-align: center; }
    mat-icon { font-size: 80px; width: 80px; height: 80px; color: #ccc; }
    h1 { color: #333; }
    p { color: #666; }
  `]
})
export class NotFoundComponent {}
