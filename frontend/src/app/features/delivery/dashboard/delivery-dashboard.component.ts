import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-delivery-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="delivery-dash-page animate-fade-in">
      <div class="dash-welcome">
        <h2>Welcome, Courier Partner {{ authService.currentUser()?.username }}!</h2>
        <p>Browse open shipments, claim delivery runs, and track order fulfillment to customers</p>
      </div>

      <div class="stats-grid">
        <a routerLink="/delivery/available" class="card stat-card stat-card-link">
          <span class="stat-icon"><i class="bi bi-box-seam"></i></span>
          <div class="stat-content">
            <span class="stat-label">Available to Claim</span>
            <strong class="stat-value accent-val">{{ availableCount() }}</strong>
          </div>
          <span class="view-pill">Claim Run &rarr;</span>
        </a>

        <a routerLink="/delivery/my-deliveries" class="card stat-card stat-card-link">
          <span class="stat-icon"><i class="bi bi-bicycle"></i></span>
          <div class="stat-content">
            <span class="stat-label">My Active Runs</span>
            <strong class="stat-value">{{ assignedCount() }}</strong>
          </div>
          <span class="view-pill">View &rarr;</span>
        </a>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-truck"></i></span>
          <div class="stat-content">
            <span class="stat-label">Out for Delivery</span>
            <strong class="stat-value">{{ outForDeliveryCount() }}</strong>
          </div>
        </div>

        <div class="card stat-card">
          <span class="stat-icon"><i class="bi bi-check-circle-fill"></i></span>
          <div class="stat-content">
            <span class="stat-label">Successfully Delivered</span>
            <strong class="stat-value">{{ deliveredCount() }}</strong>
          </div>
        </div>
      </div>

      <div class="action-banners-grid">
        <div class="card banner-card banner-claim">
          <div class="banner-body">
            <span class="banner-badge">Open Pickup Pool</span>
            <h3>{{ availableCount() }} Orders Ready for Pickup</h3>
            <p>Self-assign pending orders to your active route and deliver to customers.</p>
            <a routerLink="/delivery/available" class="btn btn-accent btn-lg">
              <i class="bi bi-inbox me-1"></i> Browse & Claim Deliveries
            </a>
          </div>
        </div>

        <div class="card banner-card banner-queue">
          <div class="banner-body">
            <span class="banner-badge">My Queue</span>
            <h3>Active Delivery Runs</h3>
            <p>Update live shipment progression (Warehouse Pickup &rarr; Out for Delivery &rarr; Complete Handover).</p>
            <a routerLink="/delivery/my-deliveries" class="btn btn-primary btn-lg">
              <i class="bi bi-send-check me-1"></i> Open My Assigned Deliveries
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .delivery-dash-page { display: flex; flex-direction: column; gap: 2rem; max-width: 1080px; margin: 0 auto; }
    .dash-welcome h2 { font-size: 1.85rem; font-weight: 800; color: var(--text-primary); }
    .dash-welcome p { color: var(--text-secondary); margin-top: 0.25rem; }

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
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      text-decoration: none;
      color: inherit;
      position: relative;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .stat-card-link:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: #0284c7;
    }
    .stat-icon { font-size: 2.2rem; }
    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
    .stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }
    .accent-val { color: #0284c7; }
    .view-pill {
      margin-left: auto;
      font-size: 0.75rem;
      font-weight: 700;
      color: #0284c7;
      background: #e0f2fe;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-full);
    }

    .action-banners-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .banner-card {
      padding: 2rem;
      border-radius: var(--radius-xl);
      color: #ffffff;
    }
    .banner-claim {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
    }
    .banner-queue {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    .banner-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }
    .banner-body h3 { font-size: 1.4rem; margin-bottom: 0.5rem; color: #ffffff; font-weight: 800; }
    .banner-body p { color: #e2e8f0; margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.45; }
  `]
})
export class DeliveryDashboardComponent implements OnInit {
  availableCount = signal<number>(0);
  assignedCount = signal<number>(0);
  outForDeliveryCount = signal<number>(0);
  deliveredCount = signal<number>(0);

  constructor(
    public authService: AuthService,
    private deliveryService: DeliveryService
  ) {}

  ngOnInit(): void {
    this.deliveryService.getAvailableDeliveries(0, 50).subscribe({
      next: (res) => {
        this.availableCount.set(res.totalElements);
      },
      error: () => {}
    });

    this.deliveryService.getMyDeliveries(0, 50).subscribe({
      next: (res) => {
        const list = res.content;
        this.assignedCount.set(list.filter(d => d.status === 'ASSIGNED' || d.status === 'ACCEPTED').length);
        this.outForDeliveryCount.set(list.filter(d => d.status === 'OUT_FOR_DELIVERY' || d.status === 'PICKED_UP').length);
        this.deliveredCount.set(list.filter(d => d.status === 'DELIVERED').length);
      },
      error: () => {}
    });
  }
}
