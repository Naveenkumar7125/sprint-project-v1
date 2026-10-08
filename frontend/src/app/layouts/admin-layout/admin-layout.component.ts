import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LogoComponent } from '../../shared/components/logo/logo.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, LogoComponent],
  template: `
    <div class="admin-root" [class.sidebar-collapsed]="isSidebarCollapsed()">
      <!-- Admin Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <a routerLink="/" class="sidebar-brand">
            <app-logo [height]="36" textColor="#FFFFFF"></app-logo>
          </a>
          <span class="admin-tag">Super Admin Center</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon"><i class="bi bi-shield-check"></i></span>
            <span class="nav-text">Admin Overview</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-people"></i></span>
            <span class="nav-text">User Management</span>
          </a>
          <a routerLink="/admin/products" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-tags"></i></span>
            <span class="nav-text">Product Catalog</span>
          </a>
          <a routerLink="/admin/categories" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-grid-3x3-gap"></i></span>
            <span class="nav-text">Categories</span>
          </a>
          <a routerLink="/admin/orders" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-box-seam"></i></span>
            <span class="nav-text">Orders & Saga Logs</span>
          </a>
          <a routerLink="/admin/delivery-assignment" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-truck"></i></span>
            <span class="nav-text">Delivery Dispatch</span>
          </a>
          <a routerLink="/admin/notifications" routerLinkActive="active" class="nav-item">
            <span class="nav-icon"><i class="bi bi-bell"></i></span>
            <span class="nav-text">Broadcast Alerts</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-chip">
            <div class="user-avatar admin-avatar">{{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() }}</div>
            <div class="user-details">
              <span class="u-name">{{ authService.currentUser()?.username }}</span>
              <span class="u-role">SYSTEM_ADMIN</span>
            </div>
          </div>
          <button class="btn-logout" (click)="authService.logout()">
            <i class="bi bi-box-arrow-right me-1"></i> Logout
          </button>
        </div>
      </aside>

      <!-- Admin Main Area -->
      <div class="admin-main">
        <header class="admin-topbar">
          <button class="toggle-btn" (click)="toggleSidebar()" aria-label="Toggle Navigation">
            <i class="bi bi-list"></i>
          </button>
          <div class="topbar-title">
            <span>Enterprise Admin Control Console</span>
          </div>
          <div class="topbar-actions">
            <a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
              <i class="bi bi-file-earmark-code me-1"></i> API Docs
            </a>
            <a routerLink="/" class="btn btn-primary btn-sm" target="_blank">
              <i class="bi bi-shop me-1"></i> Storefront
            </a>
          </div>
        </header>

        <main class="admin-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-root {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }
    .admin-sidebar {
      width: 270px;
      background: #090d16;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
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
    .admin-tag {
      font-size: 0.7rem;
      font-weight: 800;
      color: var(--danger-solid);
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
      background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
    .nav-icon { font-size: 1.15rem; }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid #1e293b;
      background: #020617;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .user-chip { display: flex; align-items: center; gap: 0.75rem; }
    .admin-avatar {
      background: #ef4444;
      width: 34px;
      height: 34px;
      border-radius: var(--radius-full);
      color: #fff;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-details { display: flex; flex-direction: column; line-height: 1.2; }
    .u-name { color: #f8fafc; font-size: 0.85rem; font-weight: 700; }
    .u-role { color: #ef4444; font-size: 0.7rem; font-weight: 800; }
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

    .admin-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .admin-topbar {
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
    .topbar-actions { display: flex; gap: 0.75rem; }
    .admin-content {
      padding: 2rem;
      flex: 1;
    }

    @media (max-width: 768px) {
      .toggle-btn { display: block; }
      .admin-sidebar {
        position: fixed;
        left: -270px;
      }
      .sidebar-collapsed .admin-sidebar { left: 0; }
      .admin-content { padding: 1.25rem; }
    }
  `]
})
export class AdminLayoutComponent {
  isSidebarCollapsed = signal<boolean>(false);

  constructor(public authService: AuthService) {}

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }
}
