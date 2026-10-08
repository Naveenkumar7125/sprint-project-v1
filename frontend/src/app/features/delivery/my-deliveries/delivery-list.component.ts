import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeliveryService } from '../../../core/services/delivery.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { DeliveryDto, DeliveryStatus } from '../../../core/models/delivery.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-delivery-list',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, PaginationComponent, EmptyStateComponent],
  template: `
    <div class="delivery-list-page">
      <div class="page-top">
        <div>
          <h2>My Assigned Deliveries Queue</h2>
          <p>Update live shipment progression and complete delivery drop-offs</p>
        </div>
      </div>

      <div class="deliveries-queue" *ngIf="deliveries().length > 0; else noDelivs">
        <div class="delivery-run-card card" *ngFor="let del of deliveries()">
          <div class="run-card-header">
            <div>
              <span class="order-tag">ORDER #{{ del.orderId }}</span>
              <h3 class="trk-title">Tracking: {{ del.trackingNumber }}</h3>
            </div>
            <app-status-badge [status]="del.status"></app-status-badge>
          </div>

          <div class="run-card-body">
            <div class="customer-info-box">
              <span class="box-label">Customer Contact & Address</span>
              <strong><i class="bi bi-person me-1"></i> {{ del.recipientName || 'Customer' }}</strong>
              <p class="phone-num"><i class="bi bi-telephone me-1"></i> {{ del.recipientPhone || '+91 98765 43210' }}</p>
              <p class="addr-desc"><i class="bi bi-geo-alt me-1"></i> {{ del.deliveryAddress || del.shippingAddressSnapshot || 'Delivery Address on file' }}</p>
            </div>

            <div class="dispatch-notes-box" *ngIf="del.notes">
              <span class="box-label">Admin Dispatch Notes:</span>
              <p>{{ del.notes }}</p>
            </div>
          </div>

          <!-- Status Progression Actions Strip -->
          <div class="run-card-footer">
            <!-- If PENDING -->
            <button
              class="btn btn-accent btn-sm"
              *ngIf="del.status === 'PENDING'"
              (click)="claimAndAcceptRun(del)"
            >
              <i class="bi bi-hand-index-thumb me-1"></i> Claim & Accept Run
            </button>

            <!-- If ASSIGNED -->
            <button
              class="btn btn-primary btn-sm"
              *ngIf="del.status === 'ASSIGNED'"
              (click)="updateStatus(del, 'ACCEPTED')"
            >
              <i class="bi bi-check-circle me-1"></i> Accept Order Run
            </button>

            <!-- If ACCEPTED -->
            <button
              class="btn btn-primary btn-sm"
              *ngIf="del.status === 'ACCEPTED'"
              (click)="updateStatus(del, 'PICKED_UP')"
            >
              <i class="bi bi-box-arrow-in-down me-1"></i> Mark as Picked Up from Warehouse
            </button>

            <!-- If PICKED_UP -->
            <button
              class="btn btn-accent btn-sm"
              *ngIf="del.status === 'PICKED_UP'"
              (click)="updateStatus(del, 'OUT_FOR_DELIVERY')"
            >
              <i class="bi bi-truck me-1"></i> Start Out for Delivery Run
            </button>

            <!-- If OUT_FOR_DELIVERY -->
            <button
              class="btn btn-primary btn-sm"
              style="background: #10b981;"
              *ngIf="del.status === 'OUT_FOR_DELIVERY'"
              (click)="openCompleteModal(del)"
            >
              <i class="bi bi-check-circle-fill me-1"></i> Confirm Successful Delivery
            </button>

            <!-- If DELIVERED -->
            <span class="delivered-text" *ngIf="del.status === 'DELIVERED'">
              <i class="bi bi-check-circle-fill text-success me-1"></i> Delivered on {{ del.deliveredAt | date:'short' }}
            </span>
          </div>
        </div>

        <app-pagination
          [currentPage]="currentPage()"
          [totalPages]="totalPages()"
          (pageChange)="loadDeliveries($event)"
        ></app-pagination>
      </div>

      <ng-template #noDelivs>
        <app-empty-state
          icon="bi-truck"
          title="No Deliveries in Queue"
          message="You have no assigned deliveries at this moment. New orders will appear here once dispatched."
        ></app-empty-state>
      </ng-template>

      <!-- Complete Delivery & COD Collection Modal -->
      <div class="modal-overlay" *ngIf="selectedDeliveryForCompletion" (click)="selectedDeliveryForCompletion = null">
        <div class="modal-box animate-fade-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Complete Delivery: Order #{{ selectedDeliveryForCompletion.orderId }}</h3>
          </div>
          <div class="modal-body">
            <p>Confirm that the package has been handed over to <strong>{{ selectedDeliveryForCompletion.recipientName }}</strong>.</p>

            <div class="form-group" style="margin-top: 1rem;">
              <label class="form-label">Cash Collected (If COD order, enter collected amount)</label>
              <input
                type="number"
                [(ngModel)]="codAmount"
                placeholder="0.00"
                class="form-control"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedDeliveryForCompletion = null">Cancel</button>
            <button class="btn btn-primary" (click)="finalizeDelivery()" [disabled]="isFinalizing">
              {{ isFinalizing ? 'Completing...' : 'Confirm Handover & Complete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .delivery-list-page { display: flex; flex-direction: column; gap: 1.5rem; max-width: 860px; margin: 0 auto; }
    .page-top h2 { font-size: 1.85rem; font-weight: 800; }
    .page-top p { color: var(--text-secondary); }

    .deliveries-queue { display: flex; flex-direction: column; gap: 1.5rem; }
    .delivery-run-card { background: #ffffff; border: 1px solid var(--border-subtle); overflow: hidden; }

    .run-card-header {
      padding: 1.25rem 1.5rem;
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .order-tag { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); }
    .trk-title { font-size: 1.1rem; font-weight: 700; margin-top: 0.2rem; }

    .run-card-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .customer-info-box {
      background: #f8fafc;
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
    }
    .box-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); display: block; margin-bottom: 0.35rem; }
    .customer-info-box strong { font-size: 1rem; display: block; margin-bottom: 0.2rem; }
    .phone-num { font-weight: 700; color: var(--primary-700); margin-bottom: 0.25rem; font-size: 0.9rem; }
    .addr-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }

    .dispatch-notes-box {
      background: var(--warning-bg);
      color: var(--warning-text);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
    }
    .dispatch-notes-box p { margin: 0; }

    .run-card-footer {
      padding: 1rem 1.5rem;
      background: #ffffff;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
    }
    .delivered-text { color: var(--success-solid); font-weight: 700; font-size: 0.9rem; }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .modal-box {
      background: #ffffff;
      border-radius: var(--radius-xl);
      max-width: 460px;
      width: 100%;
      box-shadow: var(--shadow-xl);
      overflow: hidden;
    }
    .modal-header { padding: 1.5rem 1.5rem 1rem; }
    .modal-body { padding: 0 1.5rem 1.5rem; }
    .modal-footer {
      padding: 1rem 1.5rem;
      background: var(--bg-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
  `]
})
export class DeliveryListComponent implements OnInit {
  deliveries = signal<DeliveryDto[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);

  selectedDeliveryForCompletion: DeliveryDto | null = null;
  codAmount: number = 0;
  isFinalizing: boolean = false;

  constructor(
    private deliveryService: DeliveryService,
    private paymentService: PaymentService,
    private toast: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDeliveries(0);
  }

  loadDeliveries(page: number): void {
    this.deliveryService.getMyDeliveries(page, 10).subscribe({
      next: (res) => {
        this.deliveries.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
      },
      error: () => {}
    });
  }

  claimAndAcceptRun(del: DeliveryDto): void {
    const user = this.authService.currentUser();
    const agentId = user?.id || 4;
    this.deliveryService.assignDelivery(del.id, agentId, 'Claimed directly by delivery partner').subscribe({
      next: (assigned) => {
        this.updateStatus(assigned, 'ACCEPTED');
      },
      error: () => {}
    });
  }

  updateStatus(del: DeliveryDto, newStatus: DeliveryStatus): void {
    this.deliveryService.updateDeliveryStatus(del.id, newStatus).subscribe({
      next: (updated) => {
        this.toast.success(`Shipment status updated to: ${newStatus}`);
        this.deliveries.update(list => list.map(d => d.id === updated.id ? updated : d));
      },
      error: () => {}
    });
  }

  openCompleteModal(del: DeliveryDto): void {
    this.selectedDeliveryForCompletion = del;
    this.codAmount = 0;
  }

  finalizeDelivery(): void {
    if (!this.selectedDeliveryForCompletion) return;
    this.isFinalizing = true;
    const del = this.selectedDeliveryForCompletion;

    this.deliveryService.updateDeliveryStatus(del.id, 'DELIVERED', 'Delivered to recipient').subscribe({
      next: (updated) => {
        // If COD cash was collected, trigger COD payment confirmation
        if (this.codAmount > 0) {
          this.paymentService.collectCodPayment(del.orderId, this.codAmount).subscribe({
            error: () => {}
          });
        }

        this.isFinalizing = false;
        this.toast.success('Order delivered successfully! Customer notified.');
        this.deliveries.update(list => list.map(d => d.id === updated.id ? updated : d));
        this.selectedDeliveryForCompletion = null;
      },
      error: () => {
        this.isFinalizing = false;
      }
    });
  }
}
