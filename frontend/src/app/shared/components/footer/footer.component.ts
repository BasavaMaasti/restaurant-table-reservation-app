import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <mat-icon>restaurant</mat-icon>
          <span>TableBook</span>
          <p>The easiest way to reserve your perfect dining experience.</p>
        </div>
        <div class="footer-links">
          <h4>Quick Links</h4>
          <a routerLink="/restaurants">Find Restaurants</a>
          <a routerLink="/reservations">My Reservations</a>
          <a routerLink="/auth/login">Login</a>
        </div>
        <div class="footer-links">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; {{ year }} TableBook. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer { background: #1B4332; color: rgba(255,255,255,0.8); margin-top: 60px; }
    .footer-content { max-width: 1200px; margin: 0 auto; padding: 40px 24px; display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 40px; }
    .footer-brand { display: flex; flex-direction: column; gap: 8px; }
    .footer-brand mat-icon { font-size: 2rem; color: #74C69D; }
    .footer-brand span { font-size: 1.4rem; font-weight: 700; color: white; }
    .footer-brand p { color: rgba(255,255,255,0.6); line-height: 1.6; }
    .footer-links h4 { color: white; margin-bottom: 12px; }
    .footer-links a { display: block; color: rgba(255,255,255,0.6); text-decoration: none; margin-bottom: 8px; transition: color 0.2s; }
    .footer-links a:hover { color: #74C69D; }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 16px 24px; text-align: center; font-size: 0.85rem; color: rgba(255,255,255,0.5); }
    @media (max-width: 768px) { .footer-content { grid-template-columns: 1fr; } }
  `]
})
export class FooterComponent {
  year = new Date().getFullYear();
}
