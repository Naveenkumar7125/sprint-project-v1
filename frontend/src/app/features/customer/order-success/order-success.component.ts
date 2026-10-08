import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderDto } from '../../../core/models/order.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { InvoiceModalComponent } from '../../../shared/components/invoice-modal/invoice-modal.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent, InvoiceModalComponent],
  template: `
    <div class="success-page container">
      <div class="success-card card animate-fade-in" *ngIf="order(); else loadingTpl">
        <div class="confetti-icon"><i class="bi bi-check-circle-fill text-success"></i></div>
        <span class="badge badge-success order-confirmed-badge">Order Confirmed</span>
        <h1>Thank you for your order!</h1>
        <p class="order-subtext">
          Your order has been placed successfully and the tax invoice receipt has been dispatched to your email!
        </p>

        <!-- Order Snapshot Details -->
        <div class="order-meta-box">
          <div class="meta-row">
            <span class="meta-label">Order Number</span>
            <strong class="order-num">{{ order()?.orderNumber }}</strong>
          </div>
          <div class="meta-row">
            <span class="meta-label">Payment Method</span>
            <span>{{ order()?.paymentMethod }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Items Subtotal</span>
            <span>₹{{ getItemsSubtotal(order()) | number:'1.2-2' }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Doorstep Delivery</span>
            <span *ngIf="getDeliveryFee(order()) > 0" class="badge" style="background: #fef3c7; color: #b45309; font-weight: 700;">
              ₹{{ getDeliveryFee(order()) | number:'1.2-2' }} (Order under ₹500)
            </span>
            <span *ngIf="getDeliveryFee(order()) === 0" class="badge badge-success">
              FREE (Order ≥ ₹500)
            </span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Status</span>
            <app-status-badge [status]="order()?.status || ''"></app-status-badge>
          </div>
          <div class="meta-row total-row">
            <span class="meta-label">Grand Total</span>
            <strong class="grand-total">₹{{ order()?.totalAmount | number:'1.2-2' }}</strong>
          </div>
        </div>

        <!-- Ordered Items Summary -->
        <div class="ordered-items-list">
          <h4>Items in this Order ({{ order()?.items?.length }})</h4>
          <div class="ordered-item" *ngFor="let item of order()?.items">
            <div class="item-desc">
              <strong>{{ item.productName }}</strong>
              <small>{{ item.quantity }} × ₹{{ item.unitPrice | number:'1.2-2' }}</small>
            </div>
            <strong class="item-price">₹{{ item.totalPrice | number:'1.2-2' }}</strong>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="success-actions">
          <button class="btn btn-primary invoice-action-btn" (click)="showInvoice.set(true)">
            <i class="bi bi-receipt me-1"></i> View & Download Invoice
          </button>
          <div class="secondary-actions-row">
            <a routerLink="/account/orders" class="btn btn-secondary">
              View My Orders <i class="bi bi-arrow-right ms-1"></i>
            </a>
            <a routerLink="/products" class="btn btn-outline">
              Continue Shopping <i class="bi bi-bag ms-1"></i>
            </a>
          </div>
        </div>
      </div>

      <ng-template #loadingTpl>
        <div class="loading-box">
          <p>Loading your order confirmation...</p>
        </div>
      </ng-template>

      <!-- Invoice Viewer Modal -->
      <app-invoice-modal
        *ngIf="showInvoice() && order()"
        [order]="order()"
        (closeEvent)="showInvoice.set(false)"
      ></app-invoice-modal>
    </div>
  `,
  styles: [`
    .success-page {
      padding: 2.5rem 1.25rem 4rem;
      max-width: 640px;
    }
    .success-card {
      padding: 2.25rem 2rem;
      text-align: center;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
    }
    .confetti-icon { font-size: 2.75rem; margin-bottom: 0.35rem; }
    .order-confirmed-badge { margin-bottom: 0.75rem; }
    .success-card h1 {
      font-size: 1.65rem;
      font-weight: 700;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
    }
    .order-subtext {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .order-meta-box {
      background: var(--bg-subtle);
      border-radius: var(--radius-lg);
      padding: 1.1rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      text-align: left;
      border: 1px solid var(--border-subtle);
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }
    .meta-label { color: var(--text-muted); font-weight: 600; }
    .order-num { font-family: var(--font-mono); color: var(--primary-700); }
    .total-row {
      border-top: 1px solid var(--border-strong);
      padding-top: 0.65rem;
      margin-top: 0.25rem;
    }
    .grand-total { font-size: 1.2rem; color: var(--primary-700); }

    .ordered-items-list {
      text-align: left;
      margin-bottom: 1.75rem;
    }
    .ordered-items-list h4 { font-size: 0.95rem; margin-bottom: 0.6rem; color: var(--text-primary); }
    .ordered-item {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px solid var(--border-subtle);
    }
    .item-desc { display: flex; flex-direction: column; }
    .item-desc strong { font-size: 0.875rem; color: var(--text-primary); }
    .item-desc small { color: var(--text-muted); font-size: 0.78rem; }
    .item-price { font-size: 0.875rem; color: var(--text-primary); }

    .success-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .invoice-action-btn {
      padding: 0.55rem 1.25rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--radius-md);
    }
    .secondary-actions-row {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .secondary-actions-row .btn {
      padding: 0.5rem 1rem;
      font-size: 0.84rem;
      font-weight: 600;
      border-radius: var(--radius-md);
    }
    .loading-box { text-align: center; padding: 3rem; }
  `]
})
export class OrderSuccessComponent implements OnInit {
  order = signal<OrderDto | null>(null);
  showInvoice = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = +this.route.snapshot.params['orderId'];
    if (orderId) {
      this.orderService.getOrderById(orderId).subscribe({
        next: (res) => this.order.set(res),
        error: () => {}
      });
    }
  }

  getItemsSubtotal(order: OrderDto | null): number {
    if (!order || !order.items || order.items.length === 0) {
      return order ? (order.totalAmount < 500 && order.totalAmount > 60 ? +(order.totalAmount - 60).toFixed(2) : order.totalAmount) : 0;
    }
    const sum = order.items.reduce((s, i) => s + (i.totalPrice || (i.quantity * i.unitPrice)), 0);
    return +sum.toFixed(2);
  }

  getDeliveryFee(order: OrderDto | null): number {
    const subtotal = this.getItemsSubtotal(order);
    return (subtotal > 0 && subtotal < 500) ? 60 : 0;
  }
}
