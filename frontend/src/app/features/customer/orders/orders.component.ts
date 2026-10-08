import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrderDto } from '../../../core/models/order.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { InvoiceModalComponent } from '../../../shared/components/invoice-modal/invoice-modal.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    StatusBadgeComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonLoaderComponent,
    InvoiceModalComponent
  ],
  template: `
    <div class="orders-page container">
      <div class="orders-header">
        <div>
          <h1>My Order History</h1>
          <p>Track packages, view and download official PDF tax invoices, or manage order cancellations</p>
        </div>
      </div>

      <app-skeleton-loader *ngIf="isLoading()" type="table" [count]="5"></app-skeleton-loader>

      <ng-container *ngIf="!isLoading()">
        <div class="orders-list" *ngIf="orders().length > 0; else noOrders">
          <div class="order-card card" *ngFor="let ord of orders()">
            <!-- Order Card Header -->
            <div class="order-card-top">
              <div class="order-top-left">
                <span class="order-id-label">ORDER #{{ ord.orderNumber }}</span>
                <span class="order-date">Placed on {{ ord.createdAt | date:'mediumDate' }}</span>
              </div>

              <div class="order-top-right">
                <app-status-badge [status]="ord.status"></app-status-badge>
                <strong class="order-total-price">₹{{ ord.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>

            <!-- Ordered Items in Order -->
            <div class="order-card-items">
              <div class="order-item-row" *ngFor="let item of ord.items">
                <img
                  [src]="item.productImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'"
                  [alt]="item.productName"
                  class="order-item-img"
                />
                <div class="order-item-info">
                  <h5>
                    <a [routerLink]="['/products', item.productId]">{{ item.productName }}</a>
                  </h5>
                  <span class="order-item-qty">Qty: {{ item.quantity }} × ₹{{ item.unitPrice | number:'1.2-2' }}</span>
                </div>
                <strong class="order-item-subtotal">₹{{ item.totalPrice | number:'1.2-2' }}</strong>
              </div>
            </div>

            <!-- Card Bottom Actions -->
            <div class="order-card-bottom">
              <div class="shipping-snapshot">
                <span><i class="bi bi-geo-alt me-1"></i> Shipping: {{ ord.shippingAddressSnapshot || 'Standard Delivery' }}</span>
              </div>

              <div class="order-actions">
                <button
                  class="btn btn-outline btn-sm invoice-action-btn"
                  (click)="openInvoice(ord)"
                >
                  <i class="bi bi-receipt me-1"></i> Invoice / PDF
                </button>

                <a
                  [routerLink]="['/track-delivery']"
                  [queryParams]="{ trackingNumber: 'TRK-ESHOP-' + ord.id }"
                  class="btn btn-secondary btn-sm"
                >
                  <i class="bi bi-truck me-1"></i> Track Delivery
                </a>

                <button
                  class="btn btn-danger btn-sm"
                  *ngIf="canCancelOrder(ord.status)"
                  (click)="cancelOrder(ord.id)"
                >
                  Cancel Order
                </button>
              </div>
            </div>
          </div>

          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadOrders($event)"
          ></app-pagination>
        </div>

        <ng-template #noOrders>
          <app-empty-state
            icon="bi-box-seam"
            title="No orders placed yet"
            message="You haven't placed any orders yet. Explore our wide collection and start shopping today!"
            actionLabel="Start Shopping"
            actionRoute="/products"
          ></app-empty-state>
        </ng-template>
      </ng-container>

      <!-- Invoice Viewer & Download Modal -->
      <app-invoice-modal
        *ngIf="selectedInvoiceOrder()"
        [order]="selectedInvoiceOrder()"
        (closeEvent)="selectedInvoiceOrder.set(null)"
      ></app-invoice-modal>
    </div>
  `,
  styles: [`
    .orders-page {
      padding: 2.5rem 1.25rem 5rem;
      max-width: 980px;
    }
    .orders-header {
      margin-bottom: 2rem;
    }
    .orders-header h1 { font-size: 2.2rem; font-weight: 800; }
    .orders-header p { color: var(--text-secondary); }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .order-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }
    .order-card-top {
      padding: 1.25rem 1.5rem;
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .order-top-left { display: flex; flex-direction: column; gap: 0.2rem; }
    .order-id-label { font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
    .order-date { font-size: 0.8125rem; color: var(--text-muted); }

    .order-top-right { display: flex; align-items: center; gap: 1rem; }
    .order-total-price { font-size: 1.25rem; color: var(--primary-700); }

    .order-card-items { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .order-item-row { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle); }
    .order-item-row:last-child { border-bottom: none; }
    .order-item-img { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radius-md); background: #f8fafc; }
    .order-item-info { flex: 1; min-width: 0; }
    .order-item-info h5 { font-size: 0.95rem; margin-bottom: 0.2rem; }
    .order-item-info a { color: var(--text-primary); }
    .order-item-info a:hover { color: var(--primary-600); }
    .order-item-qty { font-size: 0.8125rem; color: var(--text-muted); }
    .order-item-subtotal { font-size: 0.95rem; }

    .order-card-bottom {
      padding: 1rem 1.5rem;
      background: #ffffff;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .shipping-snapshot { font-size: 0.8125rem; color: var(--text-secondary); }
    .order-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .invoice-action-btn { font-weight: 600; border-color: #6366f1; color: #4f46e5; }
    .invoice-action-btn:hover { background: #eef2ff; }
  `]
})
export class OrdersComponent implements OnInit {
  orders = signal<OrderDto[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(true);
  selectedInvoiceOrder = signal<OrderDto | null>(null);

  constructor(
    private orderService: OrderService,
    private dialog: DialogService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrders(0);
  }

  loadOrders(page: number): void {
    this.isLoading.set(true);
    this.orderService.getMyOrders(page, 10).subscribe({
      next: (res) => {
        this.orders.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openInvoice(order: OrderDto): void {
    this.selectedInvoiceOrder.set(order);
  }

  canCancelOrder(status: string): boolean {
    return status === 'PENDING' || status === 'CONFIRMED' || status === 'PROCESSING';
  }

  async cancelOrder(orderId: number): Promise<void> {
    const confirmed = await this.dialog.confirm({
      title: 'Cancel Order?',
      message: 'Are you sure you want to cancel this order? If paid via Wallet, the full amount will be refunded immediately back to your digital wallet.',
      confirmText: 'Yes, Cancel Order',
      type: 'danger'
    });

    if (confirmed) {
      this.orderService.cancelOrder(orderId, 'Customer requested cancellation').subscribe({
        next: (updatedOrder) => {
          this.toast.success('Order cancelled. Refund credited to your wallet.');
          this.orders.update(list => list.map(o => o.id === orderId ? updatedOrder : o));
        },
        error: () => {}
      });
    }
  }
}
