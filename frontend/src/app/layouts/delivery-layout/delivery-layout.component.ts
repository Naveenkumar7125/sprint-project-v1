import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-delivery-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, LogoComponent],
  template: `
    <div class="delivery-root">
      <header class="delivery-header">
        <div class="container delivery-header-content">
          <div class="header-left">
            <app-logo [height]="36" textColor="#FFFFFF"></app-logo>
            <span class="agent-tag"><i class="bi bi-truck me-1"></i> Courier Partner</span>
          </div>
          <div class="header-right">
            <span class="agent-name"><i class="bi bi-person-badge me-1"></i> {{ authService.currentUser()?.username }}</span>
            <button class="btn btn-secondary btn-sm" (click)="authService.logout()">Logout</button>
          </div>
        </div>
      </header>

      <nav class="delivery-nav">
        <div class="container nav-tabs">
          <a routerLink="/delivery/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="tab-item">
            <i class="bi bi-speedometer2 me-1"></i> Overview
          </a>
          <a routerLink="/delivery/available" routerLinkActive="active" class="tab-item">
            <i class="bi bi-inbox me-1"></i> Available Pickup Pool
          </a>
          <a routerLink="/delivery/my-deliveries" routerLinkActive="active" class="tab-item">
            <i class="bi bi-send-check me-1"></i> My Assigned Deliveries
          </a>
        </div>
      </nav>

      <main class="container delivery-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .delivery-root {
      min-height: 100vh;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
    }
    .delivery-header {
      background: #0284c7;
      color: #ffffff;
      padding: 0.75rem 0;
    }
    .delivery-header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .agent-tag {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .header-right { display: flex; align-items: center; gap: 1rem; }
    .agent-name { font-weight: 700; font-size: 0.9rem; }

    .delivery-nav {
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
    }
    .nav-tabs {
      display: flex;
      gap: 1rem;
    }
    .tab-item {
      padding: 0.85rem 1rem;
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-secondary);
      border-bottom: 3px solid transparent;
      text-decoration: none;
    }
    .tab-item.active {
      color: #0284c7;
      border-bottom-color: #0284c7;
    }
    .delivery-main {
      padding: 2rem 1.25rem;
      flex: 1;
    }
  `]
})
export class DeliveryLayoutComponent {
  constructor(public authService: AuthService) {}
}
