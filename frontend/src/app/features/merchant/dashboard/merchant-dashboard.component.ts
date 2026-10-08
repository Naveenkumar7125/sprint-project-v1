import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { WalletService } from '../../../core/services/wallet.service';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductDto } from '../../../core/models/product.models';
import { MerchantWalletDto, SettlementDto } from '../../../core/models/wallet.models';
import { DeliveryDto } from '../../../core/models/delivery.models';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-merchant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  template: `
    <div class="merchant-dash-page">
      <div class="dash-hero">
        <div>
          <h2>Merchant Performance Center</h2>
          <p>Manage your product catalog, real-time stock levels, multi-vendor settlements, and store operations</p>
        </div>
        <a routerLink="/merchant/products/new" class="btn btn-accent btn-lg">
          <i class="bi bi-plus-circle me-1"></i> List New Product
        </a>
      </div>

      <!-- Merchant Financial Overview (Multi-Vendor Settlements & Balance) -->
      <div class="finance-banner card">
        <div class="finance-header">
          <div>
            <h3><i class="bi bi-cash-stack me-2"></i> Merchant Financial Overview</h3>
            <p>Real-time balance, pending settlements, and platform commission tracking (90% Merchant / 10% Platform)</p>
          </div>
          <span class="badge badge-success">Escrow Protected</span>
        </div>

        <div class="finance-metrics-grid">
          <div class="metric-box">
            <span class="metric-title">Available Balance</span>
            <strong class="metric-amount text-success">₹{{ (merchantWallet()?.availableBalance || 0) | number:'1.2-2' }}</strong>
            <small class="metric-hint">Ready for payout / store purchases</small>
          </div>

          <div class="metric-box">
            <span class="metric-title">Pending Settlement</span>
            <strong class="metric-amount text-warning">₹{{ (merchantWallet()?.pendingBalance || 0) | number:'1.2-2' }}</strong>
            <small class="metric-hint">Unlocks upon order delivery</small>
          </div>

          <div class="metric-box">
            <span class="metric-title">Total Lifetime Earnings</span>
            <strong class="metric-amount text-primary">₹{{ (merchantWallet()?.totalEarnings || 0) | number:'1.2-2' }}</strong>
            <small class="metric-hint">Cumulative settled net revenue</small>
          </div>
        </div>
      </div>

      <!-- Key Metrics Stats Cards -->
      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-tags"></i></span>
          <div class="stat-content">
            <span class="stat-label">Total Listings</span>
            <strong class="stat-value">{{ products().length }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-check-circle"></i></span>
          <div class="stat-content">
            <span class="stat-label">Active Products</span>
            <strong class="stat-value">{{ activeCount() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-exclamation-circle"></i></span>
          <div class="stat-content">
            <span class="stat-label">Inactive / Drafts</span>
            <strong class="stat-value">{{ inactiveCount() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-box-seam"></i></span>
          <div class="stat-content">
            <span class="stat-label">Store Inventory</span>
            <strong class="stat-value">Automated Sync</strong>
          </div>
        </div>
      </div>

      <!-- Incoming Customer Orders & Pickup Dispatch Table -->
      <div class="card catalog-preview-card">
        <div class="card-header">
          <div>
            <h3><i class="bi bi-inbox me-2"></i> Incoming Customer Orders & Pickup Dispatch</h3>
            <small style="color: var(--text-secondary);">Package orders and click 'Ready for Pickup' to dispatch to delivery agents</small>
          </div>
          <span class="badge badge-primary">{{ merchantDeliveries().length }} Orders</span>
        </div>

        <div class="table-responsive">
          <table class="table" *ngIf="merchantDeliveries().length > 0; else noOrders">
            <thead>
              <tr>
                <th>Order / Tracking</th>
                <th>Recipient Customer</th>
                <th>Destination Address</th>
                <th>Order Status</th>
                <th>Dispatch Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let del of merchantDeliveries()">
                <td>
                  <strong>ORDER #{{ del.orderId }}</strong>
                  <small class="d-block text-muted"><code>{{ del.trackingNumber }}</code></small>
                </td>
                <td>
                  <strong><i class="bi bi-person me-1"></i> {{ del.recipientName || ('Customer #' + (del.customerId || '')) }}</strong>
                  <small class="d-block text-muted" *ngIf="del.recipientPhone"><i class="bi bi-telephone me-1"></i> {{ del.recipientPhone }}</small>
                </td>
                <td>
                  <span style="font-size: 0.875rem;"><i class="bi bi-geo-alt me-1"></i> {{ del.shippingAddressSnapshot || del.deliveryAddress || 'Primary Delivery Address' }}</span>
                </td>
                <td>
                  <app-status-badge [status]="del.status" [label]="getStatusLabel(del.status)"></app-status-badge>
                </td>
                <td>
                  <!-- Action if CREATED: Ready for pickup -->
                  <div *ngIf="del.status === 'CREATED'">
                    <button
                      class="btn btn-accent btn-sm"
                      (click)="markReady(del)"
                      [disabled]="markingId === del.id"
                    >
                      <span *ngIf="markingId === del.id">Updating...</span>
                      <span *ngIf="markingId !== del.id"><i class="bi bi-check-lg me-1"></i> Ready for Pickup</span>
                    </button>
                  </div>
                  <!-- Status if already ready for pickup -->
                  <div *ngIf="del.status === 'AVAILABLE'">
                    <span class="badge badge-success"><i class="bi bi-clock me-1"></i> Waiting for Courier</span>
                  </div>
                  <!-- Status if assigned / picked up / in transit -->
                  <div *ngIf="del.status === 'ASSIGNED' || del.status === 'ACCEPTED'">
                    <span class="badge badge-warning"><i class="bi bi-bicycle me-1"></i> Assigned: {{ del.deliveryAgentName || del.deliveryAgentUsername || 'Courier' }}</span>
                  </div>
                  <div *ngIf="del.status === 'PICKED_UP' || del.status === 'OUT_FOR_DELIVERY'">
                    <span class="badge badge-info"><i class="bi bi-truck me-1"></i> In Transit</span>
                  </div>
                  <div *ngIf="del.status === 'DELIVERED'">
                    <span class="badge badge-success"><i class="bi bi-check-circle-fill me-1"></i> Delivered</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noOrders>
            <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
              <p>No incoming orders currently awaiting dispatch.</p>
            </div>
          </ng-template>
        </div>
      </div>

      <!-- Settlements Ledger Table (if any) -->
      <div class="card catalog-preview-card" *ngIf="settlements().length > 0">
        <div class="card-header">
          <h3>Recent Order Settlements & Commission Breakdown</h3>
          <span class="badge badge-primary">{{ settlements().length }} Recorded</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Gross Sale</th>
                <th>Platform Fee (10%)</th>
                <th>Net Earning (90%)</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of settlements()">
                <td>
                  <strong>{{ s.orderNumber }}</strong>
                  <small class="d-block text-muted">ID: #{{ s.orderId }}</small>
                </td>
                <td>₹{{ s.grossAmount | number:'1.2-2' }}</td>
                <td class="text-danger">-₹{{ s.platformCommission | number:'1.2-2' }}</td>
                <td class="text-success font-weight-bold">+₹{{ s.merchantAmount | number:'1.2-2' }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-warning': s.status === 'PENDING',
                    'badge-success': s.status === 'AVAILABLE' || s.status === 'COMPLETED',
                    'badge-danger': s.status === 'CANCELLED' || s.status === 'REFUNDED'
                  }">{{ s.status }}</span>
                </td>
                <td>{{ s.createdAt | date:'medium' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Product Catalog Table -->
      <div class="card catalog-preview-card">
        <div class="card-header">
          <h3>Recent Product Listings</h3>
          <a routerLink="/merchant/products" class="btn btn-secondary btn-sm">Manage All Products →</a>
        </div>

        <div class="table-responsive">
          <table class="table" *ngIf="products().length > 0; else noProds">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of products().slice(0, 5)">
                <td>
                  <div class="prod-cell">
                    <img
                      [src]="p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'"
                      [alt]="p.name"
                      class="prod-thumb"
                    />
                    <div>
                      <strong>{{ p.name }}</strong>
                      <small class="d-block text-muted">ID: #{{ p.id }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ p.categoryName || 'General' }}</td>
                <td><strong>₹{{ p.price | number:'1.2-2' }}</strong></td>
                <td>
                  <app-status-badge [status]="p.active ? 'ACTIVE' : 'INACTIVE'"></app-status-badge>
                </td>
                <td>
                  <a [routerLink]="['/merchant/products', p.id, 'edit']" class="btn btn-outline btn-sm">
                    <i class="bi bi-pencil me-1"></i> Edit
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noProds>
            <div style="padding: 3rem; text-align: center; color: var(--text-muted);">
              <p>You haven't listed any products yet. Click "List New Product" to create your first listing.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .merchant-dash-page { display: flex; flex-direction: column; gap: 2rem; }
    .dash-hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dash-hero h2 { font-size: 1.85rem; font-weight: 800; color: var(--text-primary); }
    .dash-hero p { color: var(--text-secondary); }

    .finance-banner {
      padding: 1.75rem;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: var(--radius-xl);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .finance-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 1rem;
    }
    .finance-header h3 { color: #ffffff; font-size: 1.35rem; font-weight: 800; margin: 0; }
    .finance-header p { color: #94a3b8; font-size: 0.875rem; margin: 0.25rem 0 0; }

    .finance-metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    .metric-box {
      background: rgba(255, 255, 255, 0.05);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .metric-title { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: #94a3b8; letter-spacing: 0.04em; }
    .metric-amount { font-size: 1.85rem; font-weight: 800; }
    .metric-hint { font-size: 0.75rem; color: #64748b; }
    .text-success { color: #4ade80 !important; }
    .text-warning { color: #fbbf24 !important; }
    .text-primary { color: #60a5fa !important; }
    .text-danger { color: #f87171 !important; }

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

    .catalog-preview-card { background: #ffffff; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-subtle); }
    .card-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .prod-cell { display: flex; align-items: center; gap: 0.75rem; }
    .prod-thumb { width: 44px; height: 44px; object-fit: cover; border-radius: var(--radius-sm); }
  `]
})
export class MerchantDashboardComponent implements OnInit {
  products = signal<ProductDto[]>([]);
  merchantWallet = signal<MerchantWalletDto | null>(null);
  settlements = signal<SettlementDto[]>([]);
  merchantDeliveries = signal<DeliveryDto[]>([]);
  markingId: number | null = null;

  constructor(
    private productService: ProductService,
    private walletService: WalletService,
    private deliveryService: DeliveryService,
    private toast: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.productService.getAllProducts(0, 50).subscribe({
      next: (page) => this.products.set(page.content),
      error: () => {}
    });

    this.walletService.getMerchantWallet().subscribe({
      next: (w) => this.merchantWallet.set(w),
      error: () => {}
    });

    this.walletService.getMerchantSettlements().subscribe({
      next: (res) => this.settlements.set(res.content),
      error: () => {}
    });

    this.deliveryService.getMerchantDeliveries(0, 20).subscribe({
      next: (page) => this.merchantDeliveries.set(page.content),
      error: () => {}
    });
  }

  markReady(del: DeliveryDto): void {
    this.markingId = del.id;
    this.deliveryService.markReadyForPickup(del.id).subscribe({
      next: (updated) => {
        this.markingId = null;
        this.toast.success(`Order #${del.orderId} marked Ready for Pickup! Dispatched to courier pool.`);
        this.merchantDeliveries.update(list => list.map(d => d.id === del.id ? { ...d, status: 'AVAILABLE' } : d));
      },
      error: () => {
        this.markingId = null;
        this.toast.error('Failed to mark order ready for pickup.');
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'CREATED':
        return 'Awaiting Merchant Pickup Confirmation';
      case 'AVAILABLE':
        return 'Ready for Pickup';
      case 'ASSIGNED':
      case 'ACCEPTED':
        return 'Courier Assigned';
      case 'PICKED_UP':
        return 'Picked Up by Courier';
      case 'OUT_FOR_DELIVERY':
        return 'Out for Delivery';
      case 'DELIVERED':
        return 'Delivered';
      default:
        return status;
    }
  }

  activeCount(): number {
    return this.products().filter(p => p.active).length;
  }

  inactiveCount(): number {
    return this.products().filter(p => !p.active).length;
  }
}
