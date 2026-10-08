import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { OrderDto, OrderStatus } from '../../../core/models/order.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceModalComponent } from '../../../shared/components/invoice-modal/invoice-modal.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StatusBadgeComponent, PaginationComponent, InvoiceModalComponent],
  template: `
    <div class="admin-orders-page">
      <!-- Page Header -->
      <div class="page-top">
        <div>
          <h2>Platform Orders & Saga Oversight</h2>
          <p>Supervise checkout saga orchestrations, fulfillment timelines, customer receipts, and line items</p>
        </div>

        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="loadOrders(currentPage())" [disabled]="isLoading()">
            <svg *ngIf="!isLoading()" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span *ngIf="isLoading()" class="spinner-small"></span>
            Refresh Orders
          </button>
        </div>
      </div>

      <!-- Quick Summary Metric Chips -->
      <div class="stats-ribbon">
        <div class="stat-pill" [class.active-pill]="selectedStatus === ''" (click)="setStatusFilter('')">
          <span class="stat-pill-label">All Orders</span>
          <span class="stat-pill-val">{{ totalElements() }}</span>
        </div>
        <div class="stat-pill" [class.active-pill]="selectedStatus === 'CONFIRMED'" (click)="setStatusFilter('CONFIRMED')">
          <span class="stat-pill-label">Confirmed</span>
          <span class="stat-pill-val status-pill-confirmed">{{ confirmedCount() }}</span>
        </div>
        <div class="stat-pill" [class.active-pill]="selectedStatus === 'PROCESSING'" (click)="setStatusFilter('PROCESSING')">
          <span class="stat-pill-label">Processing</span>
          <span class="stat-pill-val status-pill-processing">{{ processingCount() }}</span>
        </div>
        <div class="stat-pill" [class.active-pill]="selectedStatus === 'SHIPPED'" (click)="setStatusFilter('SHIPPED')">
          <span class="stat-pill-label">Shipped</span>
          <span class="stat-pill-val status-pill-shipped">{{ shippedCount() }}</span>
        </div>
        <div class="stat-pill" [class.active-pill]="selectedStatus === 'DELIVERED'" (click)="setStatusFilter('DELIVERED')">
          <span class="stat-pill-label">Delivered</span>
          <span class="stat-pill-val status-pill-delivered">{{ deliveredCount() }}</span>
        </div>
        <div class="stat-pill" [class.active-pill]="selectedStatus === 'CANCELLED'" (click)="setStatusFilter('CANCELLED')">
          <span class="stat-pill-label">Cancelled</span>
          <span class="stat-pill-val status-pill-cancelled">{{ cancelledCount() }}</span>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="filters-card">
        <!-- Search Input -->
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by Order #, Customer, or Email..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
          />
          <button *ngIf="searchQuery" class="clear-btn" (click)="searchQuery = ''; onSearchChange()"><i class="bi bi-x"></i></button>
        </div>

        <!-- Status Filter -->
        <div class="filter-group">
          <label for="statusFilter">Status:</label>
          <select id="statusFilter" [(ngModel)]="selectedStatus" (change)="onFilterChange()" class="form-select-sm">
            <option value="">All Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
        </div>

        <!-- Datewise Sorting Controls -->
        <div class="filter-group">
          <label for="dateSort">Sort Date:</label>
          <select id="dateSort" [(ngModel)]="sortDirection" (change)="onSortChange()" class="form-select-sm sort-select">
            <option value="desc">Date: Newest First (Desc)</option>
            <option value="asc">Date: Oldest First (Asc)</option>
          </select>
        </div>

        <!-- Page Size Selector -->
        <div class="filter-group">
          <label for="pageSize">Page Size:</label>
          <select id="pageSize" [(ngModel)]="pageSize" (change)="onPageSizeChange()" class="form-select-sm">
            <option [value]="5">5 per page</option>
            <option [value]="10">10 per page</option>
            <option [value]="20">20 per page</option>
            <option [value]="50">50 per page</option>
          </select>
        </div>

        <div class="filter-counter">
          Showing <strong>{{ orders().length }}</strong> of <strong>{{ totalElements() }}</strong> orders
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="table" *ngIf="orders().length > 0; else noOrders">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer Details</th>
                <th>Items & Preview</th>
                <th>Total Value</th>
                <th>Payment Method</th>
                <th>Saga Status</th>
                <th class="sortable-th" (click)="toggleDateSort()" title="Click to toggle Newest/Oldest order date sorting">
                  <span>Created At</span>
                  <span class="sort-indicator">
                    {{ sortDirection === 'desc' ? '▼ Newest' : '▲ Oldest' }}
                  </span>
                </th>
                <th class="text-right">Inspection</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ord of orders()" class="order-row" (click)="openOrderDetails(ord)">
                <td>
                  <code class="order-num">{{ ord.orderNumber }}</code>
                  <small class="d-block text-muted">ID: #{{ ord.id }}</small>
                </td>
                <td>
                  <div class="customer-cell">
                    <div class="customer-avatar">{{ getInitials(ord.customerUsername) }}</div>
                    <div>
                      <strong>{{ ord.customerUsername || 'Customer' }}</strong>
                      <span class="d-block text-muted" style="font-size: 0.78rem;">{{ ord.customerEmail }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="items-preview">
                    <span class="items-count-badge">{{ ord.items.length }} {{ ord.items.length === 1 ? 'item' : 'items' }}</span>
                    <span class="item-title-preview" *ngIf="ord.items[0]">
                      {{ ord.items[0].productName | slice:0:30 }}{{ ord.items[0].productName.length > 30 ? '...' : '' }}
                    </span>
                  </div>
                </td>
                <td>
                  <strong class="total-amount">₹{{ ord.totalAmount | number:'1.2-2' }}</strong>
                </td>
                <td>
                  <span class="payment-badge" [ngClass]="'pay-' + (ord.paymentMethod || 'WALLET').toLowerCase()">
                    {{ getPaymentIcon(ord.paymentMethod) }} {{ ord.paymentMethod || 'WALLET' }}
                  </span>
                </td>
                <td>
                  <app-status-badge [status]="ord.status"></app-status-badge>
                </td>
                <td>
                  <span class="date-chip">
                    {{ ord.createdAt | date:'medium' }}
                  </span>
                </td>
                <td class="text-right" (click)="$event.stopPropagation()">
                  <button class="btn btn-secondary btn-sm inspect-btn" (click)="openOrderDetails(ord)">
                    <i class="bi bi-eye me-1"></i> View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <ng-template #noOrders>
            <div class="empty-state">
              <div class="empty-icon"><i class="bi bi-box-seam"></i></div>
              <h3>No Orders Found</h3>
              <p>No orders match the current filter or date sorting criteria.</p>
              <button class="btn btn-secondary btn-sm mt-2" (click)="resetFilters()">Reset Filters</button>
            </div>
          </ng-template>
        </div>

        <!-- Pagination Bar -->
        <div class="table-pagination-footer" *ngIf="totalPages() > 1">
          <div class="pagination-info">
            Page <strong>{{ currentPage() + 1 }}</strong> of <strong>{{ totalPages() }}</strong>
            ({{ totalElements() }} total orders)
          </div>

          <app-pagination
            [currentPage]="currentPage()"
            [totalPages]="totalPages()"
            (pageChange)="loadOrders($event)"
          ></app-pagination>
        </div>
      </div>

      <!-- Order Details Inspection Modal -->
      <div class="modal-backdrop animate-fade-in" *ngIf="showDetailsModal && selectedOrder" (click)="closeDetailsModal()">
        <div class="modal-card order-details-modal animate-scale-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="header-title-wrap">
              <div class="modal-order-icon"><i class="bi bi-box-seam"></i></div>
              <div>
                <h3>Order Inspection: <code class="header-ord-num">{{ selectedOrder.orderNumber }}</code></h3>
                <p>Placed on {{ selectedOrder.createdAt | date:'fullDate' }} at {{ selectedOrder.createdAt | date:'mediumTime' }}</p>
              </div>
            </div>
            <button class="modal-close-btn" (click)="closeDetailsModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <!-- Order Meta Grid -->
            <div class="order-meta-grid">
              <div class="meta-box">
                <span class="meta-label">Customer Information</span>
                <strong>{{ selectedOrder.customerUsername || 'Registered Customer' }}</strong>
                <p class="text-muted">{{ selectedOrder.customerEmail }}</p>
                <small>Customer ID: #{{ selectedOrder.customerId || '1' }}</small>
              </div>

              <div class="meta-box">
                <span class="meta-label">Fulfillment & Saga State</span>
                <div style="margin-top: 0.25rem;">
                  <app-status-badge [status]="selectedOrder.status"></app-status-badge>
                </div>
                <small *ngIf="selectedOrder.cancellationReason" class="text-danger d-block mt-1">
                  Reason: {{ selectedOrder.cancellationReason }}
                </small>
                <small *ngIf="!selectedOrder.cancellationReason" class="text-success d-block mt-1">
                  Saga Transaction Verified
                </small>
              </div>

              <div class="meta-box">
                <span class="meta-label">Payment Breakdown</span>
                <strong>₹{{ selectedOrder.totalAmount | number:'1.2-2' }}</strong>
                <p class="text-muted">Method: {{ selectedOrder.paymentMethod || 'WALLET' }}</p>
                <span class="badge badge-success" style="font-size: 0.72rem;">PAID & SETTLED</span>
              </div>

              <div class="meta-box">
                <span class="meta-label">Shipping Address Snapshot</span>
                <p style="margin: 0; font-size: 0.85rem; line-height: 1.4; color: #334155;">
                  {{ selectedOrder.shippingAddressSnapshot || '123 Market Street, Silicon Oasis, Bangalore, 560001' }}
                </p>
              </div>
            </div>

            <!-- Ordered Line Items List -->
            <div class="order-items-section">
              <h4>Ordered Catalog Products ({{ selectedOrder.items.length }})</h4>
              <div class="items-table-wrap">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Merchant</th>
                      <th class="text-right">Unit Price</th>
                      <th class="text-center">Quantity</th>
                      <th class="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of selectedOrder.items">
                      <td>
                        <div class="item-product-cell">
                          <img
                            [src]="item.productImageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'"
                            [alt]="item.productName"
                            class="item-thumb"
                          />
                          <div>
                            <strong class="item-name">{{ item.productName }}</strong>
                            <small class="text-muted d-block">SKU/ID: #{{ item.productId }}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="merchant-badge">Merchant #{{ item.merchantId || 1 }}</span>
                      </td>
                      <td class="text-right">₹{{ item.unitPrice | number:'1.2-2' }}</td>
                      <td class="text-center"><strong>×{{ item.quantity }}</strong></td>
                      <td class="text-right"><strong class="item-total">₹{{ item.totalPrice | number:'1.2-2' }}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Total Calculation Summary -->
            <div class="order-calc-footer">
              <div class="calc-row">
                <span>Items Subtotal:</span>
                <strong>₹{{ getItemsSubtotal(selectedOrder) | number:'1.2-2' }}</strong>
              </div>
              <div class="calc-row">
                <span>Doorstep Delivery:</span>
                <span *ngIf="getDeliveryFee(selectedOrder) > 0" class="badge" style="background: #fef3c7; color: #b45309; font-weight: 700;">
                  ₹{{ getDeliveryFee(selectedOrder) | number:'1.2-2' }} (Standard fee under ₹500)
                </span>
                <span *ngIf="getDeliveryFee(selectedOrder) === 0" class="text-success font-weight-bold">
                  FREE (Order above ₹500)
                </span>
              </div>
              <div class="calc-row">
                <span>Taxes & GST (Included):</span>
                <span>₹0.00</span>
              </div>
              <div class="calc-row total-row">
                <span>Grand Total Settled:</span>
                <strong class="grand-total">₹{{ selectedOrder.totalAmount | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary btn-sm" (click)="openInvoice(selectedOrder)" style="margin-right: auto;">
              <i class="bi bi-receipt me-1"></i> View & Download PDF Tax Invoice
            </button>
            <button class="btn btn-secondary" (click)="closeDetailsModal()">Close Inspection</button>
          </div>
        </div>
      </div>

      <!-- Tax Invoice Viewer & PDF Modal -->
      <app-invoice-modal
        *ngIf="invoiceOrder()"
        [order]="invoiceOrder()"
        (closeEvent)="invoiceOrder.set(null)"
      ></app-invoice-modal>
    </div>
  `,
  styles: [`
    .admin-orders-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .page-top h2 {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      margin: 0;
    }
    .page-top p {
      color: var(--text-secondary, #64748b);
      margin: 0.25rem 0 0 0;
      font-size: 0.95rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .icon {
      width: 15px;
      height: 15px;
      margin-right: 6px;
    }

    /* Stats Ribbon */
    .stats-ribbon {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    .stat-pill {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .stat-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    }
    .stat-pill.active-pill {
      background: #eff6ff;
      border-color: #3b82f6;
    }
    .stat-pill-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-pill-val {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0.2rem;
    }
    .status-pill-confirmed { color: #2563eb; }
    .status-pill-processing { color: #d97706; }
    .status-pill-shipped { color: #7c3aed; }
    .status-pill-delivered { color: #16a34a; }
    .status-pill-cancelled { color: #dc2626; }

    /* Filters Card */
    .filters-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      width: 18px;
      height: 18px;
      color: #94a3b8;
    }
    .search-box input {
      width: 100%;
      padding: 0.55rem 2.2rem 0.55rem 2.4rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.88rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-box input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .clear-btn {
      position: absolute;
      right: 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-group label {
      font-size: 0.82rem;
      font-weight: 700;
      color: #475569;
    }
    .form-select-sm {
      padding: 0.5rem 0.85rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.85rem;
      background: #ffffff;
      color: #1e293b;
      cursor: pointer;
      outline: none;
    }
    .sort-select {
      font-weight: 600;
      color: #1e40af;
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .filter-counter {
      font-size: 0.85rem;
      color: #64748b;
      margin-left: auto;
    }

    /* Table Styles */
    .table-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .table th {
      background: #f8fafc;
      padding: 0.9rem 1.15rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
    }
    .sortable-th {
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;
    }
    .sortable-th:hover {
      color: #1d4ed8;
      background: #eff6ff;
    }
    .sort-indicator {
      font-size: 0.72rem;
      margin-left: 6px;
      color: #2563eb;
      font-weight: 800;
    }

    .table td {
      padding: 1rem 1.15rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.88rem;
      vertical-align: middle;
    }
    .order-row {
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .order-row:hover {
      background: #f8fafc;
    }

    .order-num {
      font-family: var(--font-mono, monospace);
      color: var(--primary-700, #1d4ed8);
      font-weight: 800;
      font-size: 0.9rem;
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .customer-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .items-preview {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .items-count-badge {
      font-weight: 700;
      color: #1e293b;
    }
    .item-title-preview {
      font-size: 0.78rem;
      color: #64748b;
    }

    .total-amount {
      font-size: 0.95rem;
      color: #0f172a;
    }

    .payment-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 700;
    }
    .pay-wallet { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .pay-card { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
    .pay-upi { background: #faf5ff; color: #6b21a8; border: 1px solid #e9d5ff; }
    .pay-cod { background: #fefce8; color: #854d0e; border: 1px solid #fef08a; }

    .date-chip {
      font-size: 0.82rem;
      color: #475569;
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .inspect-btn {
      font-weight: 600;
      font-size: 0.8rem;
      white-space: nowrap;
    }

    .table-pagination-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      background: #fafafa;
    }
    .pagination-info {
      font-size: 0.85rem;
      color: #64748b;
    }

    /* Modal Dialog */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: 1.5rem;
    }
    .order-details-modal {
      max-width: 720px;
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
    }
    .header-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .modal-order-icon {
      width: 42px;
      height: 42px;
      background: #eff6ff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .modal-header h3 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .header-ord-num {
      color: #2563eb;
    }
    .modal-header p {
      margin: 0.15rem 0 0 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    .modal-close-btn {
      background: #f1f5f9;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      font-weight: 700;
      color: #64748b;
    }
    .modal-close-btn:hover { background: #e2e8f0; color: #0f172a; }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .order-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
    }
    .meta-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }

    .order-items-section h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.75rem;
    }
    .items-table-wrap {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .items-table th {
      background: #f1f5f9;
      padding: 0.65rem 1rem;
      font-weight: 700;
      color: #475569;
      font-size: 0.75rem;
      text-transform: uppercase;
    }
    .items-table td {
      padding: 0.75rem 1rem;
      border-top: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .item-product-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .item-thumb {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      object-fit: cover;
      border: 1px solid #e2e8f0;
      background: #ffffff;
    }
    .item-name {
      color: #0f172a;
      font-size: 0.85rem;
    }
    .merchant-badge {
      background: #fef3c7;
      color: #92400e;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .item-total {
      color: #0f172a;
      font-size: 0.9rem;
    }

    .order-calc-footer {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .calc-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #475569;
    }
    .total-row {
      border-top: 1px solid #e2e8f0;
      padding-top: 0.5rem;
      margin-top: 0.25rem;
      font-size: 1rem;
      color: #0f172a;
    }
    .grand-total {
      font-size: 1.15rem;
      color: #1d4ed8;
      font-weight: 800;
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      padding: 3rem 1rem;
      text-align: center;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }

    .spinner-small {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: currentColor;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.6s linear infinite;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .order-meta-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminOrdersComponent implements OnInit {
  rawOrders = signal<OrderDto[]>([]);
  orders = signal<OrderDto[]>([]);

  selectedStatus: string = '';
  searchQuery: string = '';
  sortDirection: 'desc' | 'asc' = 'desc';
  pageSize: number = 10;

  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(false);

  // Inspection Modal
  showDetailsModal: boolean = false;
  selectedOrder: OrderDto | null = null;

  // Status Metrics computed
  confirmedCount = computed(() => this.rawOrders().filter(o => o.status === 'CONFIRMED').length);
  processingCount = computed(() => this.rawOrders().filter(o => o.status === 'PROCESSING').length);
  shippedCount = computed(() => this.rawOrders().filter(o => o.status === 'SHIPPED').length);
  deliveredCount = computed(() => this.rawOrders().filter(o => o.status === 'DELIVERED').length);
  cancelledCount = computed(() => this.rawOrders().filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').length);

  constructor(
    private orderService: OrderService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadOrders(0);
    this.loadAllOrdersForMetrics();
  }

  loadAllOrdersForMetrics(): void {
    this.orderService.getAllOrders(undefined, 0, 1000, 'desc').subscribe({
      next: (res) => {
        this.rawOrders.set(res.content || []);
      },
      error: () => {}
    });
  }

  loadOrders(page: number): void {
    this.isLoading.set(true);
    const statusParam = this.selectedStatus ? (this.selectedStatus as OrderStatus) : undefined;

    this.orderService.getAllOrders(statusParam, page, this.pageSize, this.sortDirection).subscribe({
      next: (res) => {
        let content = res.content || [];

        // Apply local client search filtering if query exists
        if (this.searchQuery.trim()) {
          const q = this.searchQuery.trim().toLowerCase();
          content = content.filter(o =>
            (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
            (o.customerUsername && o.customerUsername.toLowerCase().includes(q)) ||
            (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
            o.id.toString().includes(q)
          );
        }

        this.orders.set(content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages || 1);
        this.totalElements.set(res.totalElements || content.length);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadOrders(0);
  }

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.loadOrders(0);
  }

  onSortChange(): void {
    this.loadOrders(0);
  }

  toggleDateSort(): void {
    this.sortDirection = this.sortDirection === 'desc' ? 'asc' : 'desc';
    this.loadOrders(0);
  }

  onPageSizeChange(): void {
    this.loadOrders(0);
  }

  onSearchChange(): void {
    this.loadOrders(0);
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.searchQuery = '';
    this.sortDirection = 'desc';
    this.pageSize = 10;
    this.loadOrders(0);
  }

  invoiceOrder = signal<OrderDto | null>(null);

  openOrderDetails(order: OrderDto): void {
    this.selectedOrder = order;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedOrder = null;
  }

  openInvoice(order: OrderDto | null): void {
    if (order) {
      this.invoiceOrder.set(order);
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

  getInitials(name?: string): string {
    if (!name) return 'C';
    return name.substring(0, 2).toUpperCase();
  }

  getPaymentIcon(method?: string): string {
    switch ((method || '').toUpperCase()) {
      case 'WALLET': return 'WALLET';
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
      case 'CARD': return 'CARD';
      case 'UPI': return 'UPI';
      case 'CASH_ON_DELIVERY':
      case 'COD': return 'COD';
      default: return 'CARD';
    }
  }
}
