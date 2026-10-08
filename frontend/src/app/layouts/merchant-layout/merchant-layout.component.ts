import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-merchant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, LogoComponent],
  template: `
    <div class="dashboard-root" [class.sidebar-collapsed]="isSidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="dashboard-sidebar">
        <div class="sidebar-header">
          <a routerLink="/" class="sidebar-brand">
            <app-logo [height]="36" textColor="#FFFFFF"></app-logo>
          </a>
          <span class="portal-tag">Merchant Hub</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/merchant/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon"><i class="bi bi-graph-up-arrow"></i></span>
            <span class="nav-text">Overview & Stats</span>
          </a>
          <a routerLink="/merchant/products" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon"><i class="bi bi-tag"></i></span>
            <span class="nav-text">My Products</span>
          </a>
          <a routerLink="/merchant/products/new" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-plus-circle"></i></span>
            <span class="nav-text">Add Product</span>
          </a>
          <a routerLink="/merchant/inventory" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-boxes"></i></span>
            <span class="nav-text">Stock & Inventory</span>
          </a>
          <a routerLink="/merchant/profile" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-person"></i></span>
            <span class="nav-text">Merchant Profile</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="user-avatar">{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() }}</div>
            <div class="user-details">
              <span class="u-name">{{ authService.currentUser()?.username }}</span>
              <span class="u-role">Merchant</span>
            </div>
          </div>
          <button class="btn-logout" (click)="authService.logout()">
            <i class="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        </div>
      </aside>

      <!-- Main Dashboard Content Area -->
      <div class="dashboard-main">
        <header class="dashboard-topbar">
          <button class="toggle-btn" (click)="toggleSidebar()" aria-label="Toggle Sidebar">
            <i class="bi bi-list"></i>
          </button>
          <div class="topbar-title">
            <span>Merchant Control Center</span>
          </div>
          <div class="topbar-actions">
            <a routerLink="/" class="btn btn-secondary btn-sm" target="_blank">
              <i class="bi bi-shop me-1"></i> View Storefront
            </a>
          </div>
        </header>

        <main class="dashboard-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-root {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    .dashboard-sidebar {
      width: 260px;
      background: #0f172a;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      border-right: 1px solid #1e293b;
    }
    .sidebar-header {
      padding: 1.5rem 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      border-bottom: 1px solid #1e293b;
    }
    .portal-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--accent-400);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .sidebar-nav {
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      color: #94a3b8;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
    }
    .nav-item:hover {
      background: #1e293b;
      color: #f8fafc;
    }
    .nav-item.active {
      background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
      color: #ffffff;
      box-shadow: var(--shadow-sm);
    }
    .nav-icon { font-size: 1.15rem; }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #1e293b;
      background: #090d16;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .user-chip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-full);
      background: var(--accent-500);
      color: #fff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-details { display: flex; flex-direction: column; line-height: 1.2; }
    .u-name { color: #f8fafc; font-size: 0.85rem; font-weight: 700; }
    .u-role { color: #64748b; font-size: 0.75rem; }
    .btn-logout {
      background: none;
      border: 1px solid #334155;
      color: #ef4444;
      padding: 0.4rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-logout:hover { background: #1e293b; }

    .dashboard-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .dashboard-topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 90;
    }
    .toggle-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--text-secondary);
      cursor: pointer;
      display: none;
    }
    .topbar-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .dashboard-content {
      padding: 2rem;
      flex: 1;
    }

    @media (max-width: 768px) {
      .toggle-btn { display: block; }
      .dashboard-sidebar {
        position: fixed;
        left: -260px;
      }
      .sidebar-collapsed .dashboard-sidebar {
        left: 0;
      }
      .dashboard-content { padding: 1.25rem; }
    }
  `]
})
export class MerchantLayoutComponent {
  isSidebarCollapsed = signal<boolean>(false);

  constructor(public authService: AuthService) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }
}
