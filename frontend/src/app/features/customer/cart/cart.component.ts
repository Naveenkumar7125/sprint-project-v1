import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, EmptyStateComponent],
  template: `
    <div class="cart-page container">
      <h1 class="page-title">Shopping Cart</h1>

      <div class="cart-grid" *ngIf="cartService.cart()?.items?.length; else emptyCart">
        <!-- Cart Items Table -->
        <div class="cart-items-column">
          <div class="card cart-table-card">
            <div class="cart-item-row" *ngFor="let item of cartService.cart()?.items">
              <img
                [src]="getImageUrl(item.productImageUrl)"
                [alt]="item.productName"
                class="item-img"
              />

              <div class="item-info">
                <h4>
                  <a [routerLink]="['/products', item.productId]">{{ item.productName }}</a>
                </h4>
                <div class="item-unit-price">₹{{ item.unitPrice | number:'1.2-2' }} each</div>
              </div>

              <!-- Quantity Stepper -->
              <div class="qty-stepper">
                <button
                  type="button"
                  class="qty-step-btn"
                  (click)="cartService.updateQuantity(item.productId, item.quantity - 1).subscribe()"
                >
                  -
                </button>
                <span class="qty-count">{{ item.quantity }}</span>
                <button
                  type="button"
                  class="qty-step-btn"
                  (click)="cartService.updateQuantity(item.productId, item.quantity + 1).subscribe()"
                >
                  +
                </button>
              </div>

              <div class="item-total-price">
                ₹{{ item.totalPrice | number:'1.2-2' }}
              </div>

              <button
                class="remove-item-btn"
                (click)="cartService.removeItem(item.productId).subscribe()"
                title="Remove Item"
                aria-label="Remove item"
              >
                <i class="bi bi-trash3"></i>
              </button>
            </div>

            <div class="cart-card-footer">
              <button class="btn btn-secondary btn-sm" (click)="cartService.clearCart().subscribe()">
                Clear Entire Cart
              </button>
              <a routerLink="/products" class="continue-shopping-link">
                ← Continue Shopping
              </a>
            </div>
          </div>
        </div>

        <!-- Order Summary Column -->
        <div class="summary-column">
          <div class="card summary-card">
            <h3>Order Summary</h3>

            <div class="summary-line">
              <span>Subtotal ({{ cartService.totalItems() }} items)</span>
              <strong>₹{{ cartService.subtotalAmount() | number:'1.2-2' }}</strong>
            </div>

            <div class="summary-line">
              <span>Delivery Charges</span>
              <span *ngIf="cartService.deliveryFee() > 0" class="delivery-fee-tag">
                ₹{{ cartService.deliveryFee() | number:'1.2-2' }}
              </span>
              <span *ngIf="cartService.deliveryFee() === 0" class="badge badge-success">
                FREE
              </span>
            </div>

            <!-- Free delivery threshold prompt -->
            <div class="delivery-hint-box" *ngIf="cartService.deliveryFee() > 0">
              <span class="hint-icon"><i class="bi bi-truck"></i></span>
              <span>Add <strong>₹{{ cartService.amountNeededForFreeDelivery() | number:'1.2-2' }}</strong> more to get <strong>FREE Delivery</strong> (orders above ₹500)!</span>
            </div>
            <div class="delivery-free-box" *ngIf="cartService.deliveryFee() === 0 && cartService.subtotalAmount() >= 500">
              <span class="hint-icon"><i class="bi bi-check-circle-fill"></i></span>
              <span>You've unlocked <strong>FREE Doorstep Delivery</strong>!</span>
            </div>

            <div class="summary-line">
              <span>Estimated Tax (GST Included)</span>
              <span>₹0.00</span>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-line total-line">
              <span>Order Total</span>
              <span class="total-amount">₹{{ cartService.totalAmount() | number:'1.2-2' }}</span>
            </div>

            <a routerLink="/checkout" class="btn btn-accent btn-lg checkout-btn">
              Proceed to Checkout <i class="bi bi-arrow-right ms-1"></i>
            </a>

            <div class="trust-guarantee">
              <span><i class="bi bi-shield-check me-1"></i> 100% Safe & Secure Payments</span>
            </div>
          </div>
        </div>
      </div>

      <ng-template #emptyCart>
        <app-empty-state
          icon="bi-cart-x"
          title="Your Shopping Cart is Empty"
          message="Looks like you haven't added any items to your cart yet. Explore our featured products!"
          actionLabel="Start Shopping Now"
          actionRoute="/products"
        ></app-empty-state>
      </ng-template>
    </div>
  `,
  styles: [`
    .cart-page {
      padding: 2.5rem 1.25rem 5rem;
    }
    .page-title {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 2rem;
      color: var(--text-primary);
    }
    .cart-grid {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: 2rem;
      align-items: flex-start;
    }

    .cart-table-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
    }
    .cart-item-row {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .item-img {
      width: 72px;
      height: 72px;
      object-fit: cover;
      border-radius: var(--radius-md);
      background: #f8fafc;
      flex-shrink: 0;
    }
    .item-info { flex: 1; min-width: 0; }
    .item-info h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-info a { color: var(--text-primary); }
    .item-info a:hover { color: var(--primary-600); }
    .item-unit-price { font-size: 0.8125rem; color: var(--text-secondary); }

    .qty-stepper {
      display: flex;
      align-items: center;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: #ffffff;
    }
    .qty-step-btn {
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      font-weight: 700;
      cursor: pointer;
    }
    .qty-step-btn:hover { background: var(--bg-subtle); }
    .qty-count { width: 32px; text-align: center; font-weight: 700; font-size: 0.9rem; }

    .item-total-price {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-primary);
      min-width: 90px;
      text-align: right;
    }
    .remove-item-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .cart-card-footer {
      padding: 1.25rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fafafa;
    }
    .continue-shopping-link {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    /* Summary */
    .summary-card {
      padding: 1.75rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .summary-card h3 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.5rem; }
    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .summary-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 0.5rem 0;
    }
    .total-line {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .total-amount { font-size: 1.5rem; color: var(--primary-700); }
    .checkout-btn { width: 100%; margin-top: 0.5rem; }
    .delivery-fee-tag {
      font-weight: 700;
      color: #b45309;
      background: #fef3c7;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.85rem;
    }
    .delivery-hint-box {
      background: #eff6ff;
      border: 1px dashed #60a5fa;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      font-size: 0.8rem;
      color: #1e40af;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.35;
    }
    .delivery-free-box {
      background: #ecfdf5;
      border: 1px dashed #34d399;
      border-radius: 8px;
      padding: 0.65rem 0.85rem;
      font-size: 0.8rem;
      color: #065f46;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      line-height: 1.35;
    }
    .hint-icon { font-size: 1.1rem; flex-shrink: 0; }

    @media (max-width: 850px) {
      .cart-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CartComponent implements OnInit {
  constructor(
    public cartService: CartService,
    private cloudinaryService: CloudinaryService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
  }

  getImageUrl(url?: string): string {
    if (url) return this.cloudinaryService.getOptimizedUrl(url, 150, 150);
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150';
  }
}
