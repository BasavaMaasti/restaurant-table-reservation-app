import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { Store } from '@ngrx/store';
import { AuthActions } from './store/auth/auth.actions';
import { SocketService } from './core/services/socket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navbar></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container { display: flex; flex-direction: column; min-height: 100vh; }
    .main-content { flex: 1; }
  `]
})
export class AppComponent implements OnInit {
  constructor(private store: Store, private socketService: SocketService) {}

  ngOnInit() {
    this.store.dispatch(AuthActions.loadCurrentUser());
    this.socketService.connect();
  }
}
