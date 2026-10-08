import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WalletService } from '../../../core/services/wallet.service';
import { PlatformCommissionSummaryDto, WalletDto } from '../../../core/models/wallet.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-dash-page">
      <div class="dash-hero">
        <div>
          <h2>System Operations Telemetry</h2>
          <p>Global monitoring across 12 distributed Spring Cloud microservices</p>
        </div>
      </div>

      <!-- Financial Platform Overview Banner -->
      <div class="card finance-banner-card">
        <div class="finance-header">
          <div>
            <h3><i class="bi bi-bank2 me-2"></i> Platform Financial Treasury & Escrow</h3>
            <p>Live financial telemetry across customer wallet payments and merchant settlements</p>
          </div>
          <span class="badge badge-success">Platform Split: 10% Admin / 90% Merchant</span>
        </div>

        <div class="finance-metrics-row">
          <div class="finance-metric-box">
            <span class="f-title">Admin Settlement Wallet</span>
            <strong class="f-amount text-success">₹{{ (adminWallet()?.balance || 0) | number:'1.2-2' }}</strong>
            <small class="f-hint">Primary platform liquid balance</small>
          </div>

          <div class="finance-metric-box">
            <span class="f-title">Total Platform 10% Revenue</span>
            <strong class="f-amount text-primary">₹{{ (commissions()?.totalPlatformCommission || 0) | number:'1.2-2' }}</strong>
            <small class="f-hint">10% platform fee from orders</small>
          </div>

          <div class="finance-metric-box">
            <span class="f-title">Gross Merchandise Value (GMV)</span>
            <strong class="f-amount text-dark">₹{{ (commissions()?.totalGrossMerchandiseValue || 0) | number:'1.2-2' }}</strong>
            <small class="f-hint">Total volume processed</small>
          </div>

          <div class="finance-metric-box">
            <span class="f-title">Settlement Records</span>
            <strong class="f-amount text-info">{{ commissions()?.totalSettlementsCount || 0 }}</strong>
            <small class="f-hint">{{ commissions()?.completedSettlementsCount || 0 }} Completed</small>
          </div>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-box-seam"></i></span>
          <div class="stat-content">
            <span class="stat-label">Total Platform Orders</span>
            <strong class="stat-value">{{ totalOrders() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-tags"></i></span>
          <div class="stat-content">
            <span class="stat-label">Catalog Products</span>
            <strong class="stat-value">{{ totalProducts() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-truck"></i></span>
          <div class="stat-content">
            <span class="stat-label">Active Delivery Tasks</span>
            <strong class="stat-value">{{ totalDeliveries() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-bell"></i></span>
          <div class="stat-content">
            <span class="stat-label">Dispatched Alerts</span>
            <strong class="stat-value">{{ totalNotifications() }}</strong>
          </div>
        </div>
      </div>

      <!-- Quick Action Panels Grid -->
      <div class="quick-panels-grid">
        <!-- Delivery Dispatch Panel -->
        <div class="card panel-card">
          <div class="card-header">
            <h3><i class="bi bi-truck me-2"></i> Courier Task Dispatch</h3>
            <a routerLink="/admin/delivery-assignment" class="btn btn-secondary btn-sm">Open Console →</a>
          </div>
          <div class="card-body">
            <p>Assign pending ready-for-delivery orders to available couriers with custom dispatch notes.</p>
          </div>
        </div>

        <!-- Catalog Moderation Panel -->
        <div class="card panel-card">
          <div class="card-header">
            <h3><i class="bi bi-check-circle me-2"></i> Product Moderation</h3>
            <a routerLink="/admin/products" class="btn btn-secondary btn-sm">Manage Catalog →</a>
          </div>
          <div class="card-body">
            <p>Inspect merchant submissions, toggle active/inactive status, or remove prohibited listings.</p>
          </div>
        </div>

        <!-- User Accounts Panel -->
        <div class="card panel-card">
          <div class="card-header">
            <h3><i class="bi bi-people me-2"></i> User Directory</h3>
            <a routerLink="/admin/users" class="btn btn-secondary btn-sm">Manage Users →</a>
          </div>
          <div class="card-body">
            <p>Manage Customer, Merchant, Admin, and Delivery Agent role authorizations and account states.</p>
          </div>
        </div>

        <!-- Category Management Panel -->
        <div class="card panel-card">
          <div class="card-header">
            <h3><i class="bi bi-grid-3x3-gap me-2"></i> Department Categories</h3>
            <a routerLink="/admin/categories" class="btn btn-secondary btn-sm">Categories →</a>
          </div>
          <div class="card-body">
            <p>Create new departmental categories for catalog browsing and merchant categorization.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dash-page { display: flex; flex-direction: column; gap: 2rem; }
    .dash-hero h2 { font-size: 1.85rem; font-weight: 800; }
    .dash-hero p { color: var(--text-secondary); }

    .finance-banner-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 1.75rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);
    }
    .finance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding-bottom: 1rem;
    }
    .finance-header h3 { margin: 0 0 0.25rem 0; color: #ffffff; font-size: 1.25rem; font-weight: 700; }
    .finance-header p { margin: 0; color: #94a3b8; font-size: 0.875rem; }
    .finance-metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.25rem;
    }
    .finance-metric-box {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .f-title { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .f-amount { font-size: 1.5rem; font-weight: 800; }
    .f-hint { font-size: 0.75rem; color: #64748b; }
    .text-success { color: #10b981 !important; }
    .text-primary { color: #38bdf8 !important; }
    .text-dark { color: #f8fafc !important; }
    .text-info { color: #a855f7 !important; }
    .badge-success { background: #059669; color: #fff; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
    }
    .stat-card {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: #ffffff;
    }
    .stat-icon { font-size: 2.2rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }

    .quick-panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .panel-card { background: #ffffff; }
    .panel-card p { font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  totalOrders = signal<number>(0);
  totalProducts = signal<number>(0);
  totalDeliveries = signal<number>(0);
  totalNotifications = signal<number>(0);
  adminWallet = signal<WalletDto | null>(null);
  commissions = signal<PlatformCommissionSummaryDto | null>(null);

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private deliveryService: DeliveryService,
    private notificationService: NotificationService,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    this.walletService.getWallet().subscribe({
      next: (wallet) => this.adminWallet.set(wallet),
      error: () => {}
    });

    this.walletService.getAdminCommissions().subscribe({
      next: (summary) => this.commissions.set(summary),
      error: () => {}
    });

    this.orderService.getAllOrders(undefined, 0, 1).subscribe({
      next: (res) => this.totalOrders.set(res.totalElements),
      error: () => {}
    });

    this.productService.getAllProducts(0, 1).subscribe({
      next: (res) => this.totalProducts.set(res.totalElements),
      error: () => {}
    });

    this.deliveryService.getAllDeliveries(undefined, 0, 1).subscribe({
      next: (res) => this.totalDeliveries.set(res.totalElements),
      error: () => {}
    });

    this.notificationService.getAllNotifications(undefined, 0, 1).subscribe({
      next: (res) => this.totalNotifications.set(res.totalElements),
      error: () => {}
    });
  }
}

