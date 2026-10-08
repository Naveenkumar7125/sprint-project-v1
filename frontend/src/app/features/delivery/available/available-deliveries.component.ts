import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DeliveryService } from '../../../core/services/delivery.service';
import { ToastService } from '../../../core/services/toast.service';
import { DeliveryDto } from '../../../core/models/delivery.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-available-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, PaginationComponent, EmptyStateComponent],
  template: `
    <div class="available-deliveries-page animate-fade-in">
      <div class="page-top">
        <div>
          <h2><i class="bi bi-inbox me-2"></i> Available Deliveries Pool</h2>
          <p>Browse unassigned shipments waiting for pickup and take orders directly for customer delivery</p>
        </div>
        <div class="top-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadDeliveries(currentPage())" [disabled]="isLoading">
            <i class="bi bi-arrow-clockwise me-1"></i> Refresh Pool
          </button>
          <a routerLink="/delivery/my-deliveries" class="btn btn-outline btn-sm">
            <i class="bi bi-bicycle me-1"></i> View My Active Queue
          </a>
        </div>
      </div>

      <!-- Quick Summary Banner -->
      <div class="pool-banner card">
        <div class="banner-icon"><i class="bi bi-lightning-charge-fill"></i></div>
        <div class="banner-text">
          <strong>Ready for Pickup Dispatch Pool</strong>
          <span>Shipments confirmed 'Ready for Pickup' by merchants. Choose any available order to claim and deliver.</span>
        </div>
        <span class="pool-counter-badge">{{ totalAvailable() }} Ready Shipments</span>
      </div>

      <!-- Deliveries Grid -->
      <div class="deliveries-grid" *ngIf="deliveries().length > 0; else noAvailable">
        <div class="available-card card" *ngFor="let del of deliveries()">
          <div class="card-header-strip">
            <div>
              <span class="order-tag">ORDER #{{ del.orderId }}</span>
              <h3 class="trk-num">
                <code>{{ del.trackingNumber }}</code>
              </h3>
            </div>
            <app-status-badge [status]="del.status" [label]="del.status === 'AVAILABLE' ? 'Ready for Pickup' : del.status"></app-status-badge>
          </div>

          <div class="card-body-content">
            <div class="info-group">
              <span class="info-label">Customer Recipient</span>
              <strong class="recipient-name"><i class="bi bi-person me-1"></i> {{ del.recipientName }}</strong>
              <a [href]="'tel:' + del.recipientPhone" class="phone-link"><i class="bi bi-telephone me-1"></i> {{ del.recipientPhone }}</a>
            </div>

            <div class="info-group addr-group">
              <span class="info-label">Delivery Destination</span>
              <p class="addr-text"><i class="bi bi-geo-alt me-1"></i> {{ del.deliveryAddress }}</p>
            </div>

            <div class="notes-box" *ngIf="del.notes">
              <span class="notes-label">Dispatch Notes:</span>
              <p>{{ del.notes }}</p>
            </div>

            <div class="timestamp-strip">
              <span>Ordered {{ del.createdAt | date:'medium' }}</span>
            </div>
          </div>

          <div class="card-footer-action">
            <button
              class="btn btn-accent btn-block btn-claim"
              (click)="takeDelivery(del)"
              [disabled]="claimingId === del.id"
            >
              <span *ngIf="claimingId === del.id">Assigning to you...</span>
              <span *ngIf="claimingId !== del.id"><i class="bi bi-hand-index-thumb me-1"></i> Claim & Deliver This Order</span>
            </button>
          </div>
        </div>
      </div>

      <div style="margin-top: 1.5rem;" *ngIf="totalPages() > 1">
        <app-pagination
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          (pageChange)="loadDeliveries($event)"
        ></app-pagination>
      </div>

      <ng-template #noAvailable>
        <app-empty-state
          icon="bi-box-seam"
          title="No Available Deliveries in Pool"
          message="All shipments are currently assigned or delivered. Check back shortly as new customer orders come in!"
        ></app-empty-state>
      </ng-template>
    </div>
  `,
  styles: [`
    .available-deliveries-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 1080px;
      margin: 0 auto;
    }
    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; color: var(--text-primary); }
    .page-top p { color: var(--text-secondary); margin-top: 0.25rem; }
    .top-actions { display: flex; gap: 0.75rem; align-items: center; }

    .pool-banner {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-radius: var(--radius-lg);
    }
    .banner-icon { font-size: 1.75rem; }
    .banner-text { display: flex; flex-direction: column; flex: 1; }
    .banner-text strong { font-size: 1rem; }
    .banner-text span { font-size: 0.85rem; color: #e0f2fe; }
    .pool-counter-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-full);
      font-weight: 800;
      font-size: 0.85rem;
      white-space: nowrap;
    }

    .deliveries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .available-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .available-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
      border-color: #0284c7;
    }

    .card-header-strip {
      padding: 1.25rem 1.25rem 1rem;
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .order-tag { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); }
    .trk-num { font-size: 0.95rem; font-weight: 700; margin-top: 0.2rem; }
    .trk-num code { color: var(--primary-700); font-family: var(--font-mono); }

    .card-body-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      flex: 1;
    }
    .info-group { display: flex; flex-direction: column; }
    .info-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.2rem; }
    .recipient-name { font-size: 0.95rem; }
    .phone-link { color: #0284c7; font-weight: 700; font-size: 0.875rem; text-decoration: none; margin-top: 0.15rem; }
    .phone-link:hover { text-decoration: underline; }
    .addr-text { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.45; margin: 0; }

    .notes-box {
      background: #fef3c7;
      border: 1px solid #fde68a;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
      color: #92400e;
    }
    .notes-label { font-weight: 700; display: block; margin-bottom: 0.15rem; }
    .notes-box p { margin: 0; }

    .timestamp-strip { font-size: 0.75rem; color: var(--text-muted); padding-top: 0.5rem; border-top: 1px dashed var(--border-subtle); }

    .card-footer-action {
      padding: 1rem 1.25rem;
      background: #ffffff;
      border-top: 1px solid var(--border-subtle);
    }
    .btn-claim {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      font-weight: 700;
      border-radius: var(--radius-lg);
    }
  `]
})
export class AvailableDeliveriesComponent implements OnInit {
  deliveries = signal<DeliveryDto[]>([]);
  totalAvailable = signal<number>(0);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = false;
  claimingId: number | null = null;

  constructor(
    private deliveryService: DeliveryService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDeliveries(0);
  }

  loadDeliveries(page: number): void {
    this.isLoading = true;
    this.deliveryService.getAvailableDeliveries(page, 12).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.deliveries.set(res.content);
        this.totalAvailable.set(res.totalElements);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  takeDelivery(del: DeliveryDto): void {
    this.claimingId = del.id;
    this.deliveryService.acceptDelivery(del.id).subscribe({
      next: () => {
        this.claimingId = null;
        this.toast.success(`Order #${del.orderId} accepted and added to your delivery queue.`);
        this.deliveries.update(list => list.filter(d => d.id !== del.id));
        this.totalAvailable.update(count => Math.max(0, count - 1));
      },
      error: () => {
        this.claimingId = null;
        this.toast.error('Failed to claim delivery. Please try again.');
      }
    });
  }
}
