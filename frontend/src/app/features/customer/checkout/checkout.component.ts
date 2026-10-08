import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ProfileService } from '../../../core/services/profile.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ToastService } from '../../../core/services/toast.service';
import { AddressDto } from '../../../core/models/profile.models';
import { PaymentMethod, OrderCreateRequest } from '../../../core/models/order.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="checkout-page container">
      <h1 class="checkout-heading">Fast & Secure Checkout</h1>

      <div class="checkout-grid" *ngIf="cartService.cart()?.items?.length; else noItems">
        <!-- Steps Column -->
        <div class="steps-column">
          <!-- Step 1: Delivery Address -->
          <div class="card step-card">
            <div class="step-header">
              <span class="step-number">1</span>
              <h3>Select Delivery Address</h3>
            </div>

            <div class="step-body">
              <div class="addresses-grid" *ngIf="addresses().length > 0">
                <div
                  *ngFor="let addr of addresses()"
                  class="address-option-card"
                  [class.selected]="selectedAddressId === addr.id"
                  (click)="selectAddress(addr.id!)"
                >
                  <div class="radio-indicator">
                    <span class="radio-dot" *ngIf="selectedAddressId === addr.id"></span>
                  </div>
                  <div class="address-details">
                    <div class="addr-tags">
                      <span class="badge badge-primary">{{ addr.addressType || 'HOME' }}</span>
                      <span class="badge badge-success" *ngIf="addr.isDefault">Default</span>
                    </div>
                    <strong>{{ addr.streetAddress }}</strong>
                    <p>{{ addr.city }}, {{ addr.state }} - {{ addr.postalCode }}</p>
                    <small>{{ addr.country }}</small>
                  </div>
                </div>
              </div>

              <!-- Add New Address Accordion / Button -->
              <div class="new-addr-section">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="toggleNewAddressForm()"
                >
                  {{ showNewAddressForm ? 'Close Address Form' : 'Add New Delivery Address' }}
                </button>

                <form
                  [formGroup]="addressForm"
                  (ngSubmit)="saveNewAddress()"
                  class="new-addr-form animate-fade-in"
                  *ngIf="showNewAddressForm"
                >
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Street Address</label>
                      <input type="text" formControlName="streetAddress" placeholder="e.g. 102 MG Road, Flat 4B" class="form-control" />
                    </div>
                  </div>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">City</label>
                      <input type="text" formControlName="city" placeholder="City" class="form-control" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">State</label>
                      <input type="text" formControlName="state" placeholder="State" class="form-control" />
                    </div>
                  </div>

                  <div class="form-row-2">
                    <div class="form-group">
                      <label class="form-label">Postal Code</label>
                      <input type="text" formControlName="postalCode" placeholder="6-digit ZIP / PIN" class="form-control" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Country</label>
                      <input type="text" formControlName="country" placeholder="India" class="form-control" />
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary btn-sm" [disabled]="addressForm.invalid || isSavingAddress">
                    Save & Use This Address
                  </button>
                </form>
              </div>
            </div>
          </div>

          <!-- Step 2: Payment Method -->
          <div class="card step-card">
            <div class="step-header">
              <span class="step-number">2</span>
              <h3>Choose Payment Method</h3>
            </div>

            <div class="step-body">
              <div class="payment-methods-list">
                <!-- Digital Wallet Option -->
                <div
                  class="payment-option-card"
                  [class.selected]="selectedPaymentMethod === 'WALLET'"
                  (click)="selectedPaymentMethod = 'WALLET'"
                >
                  <div class="radio-indicator">
                    <span class="radio-dot" *ngIf="selectedPaymentMethod === 'WALLET'"></span>
                  </div>
                  <div class="method-info">
                    <div class="method-title">
                      <span><i class="bi bi-wallet2 me-1"></i> EShopping Digital Wallet</span>
                      <span class="badge badge-accent">Instant Settlement</span>
                    </div>
                    <p class="method-desc">
                      Available Balance: <strong>₹{{ walletService.wallet().balance | number:'1.2-2' }}</strong>
                    </p>

                    <!-- Low balance warning / instant top-up prompt -->
                    <div class="wallet-balance-alert" *ngIf="isWalletBalanceInsufficient()">
                      <i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> Insufficient wallet balance for this order. Current balance is ₹{{ walletService.wallet().balance | number:'1.2-2' }}.
                      <a routerLink="/account/wallet" target="_blank" class="topup-inline-link">Top-up Wallet</a>
                    </div>
                  </div>
                </div>

                <!-- Cash on Delivery Option -->
                <div
                  class="payment-option-card"
                  [class.selected]="selectedPaymentMethod === 'CASH_ON_DELIVERY'"
                  (click)="selectedPaymentMethod = 'CASH_ON_DELIVERY'"
                >
                  <div class="radio-indicator">
                    <span class="radio-dot" *ngIf="selectedPaymentMethod === 'CASH_ON_DELIVERY'"></span>
                  </div>
                  <div class="method-info">
                    <div class="method-title">
                      <span><i class="bi bi-cash-stack me-1"></i> Cash on Delivery (COD)</span>
                    </div>
                    <p class="method-desc">Pay with cash or UPI directly to our verified courier partner upon delivery.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Checkout Summary Column -->
        <div class="checkout-summary-column">
          <div class="card summary-box">
            <h3>Order Review</h3>

            <div class="order-items-mini">
              <div class="mini-item" *ngFor="let item of cartService.cart()?.items">
                <span class="mini-qty">{{ item.quantity }}x</span>
                <span class="mini-name">{{ item.productName }}</span>
                <span class="mini-price">₹{{ item.totalPrice | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="summary-line">
              <span>Items Subtotal</span>
              <strong>₹{{ cartService.subtotalAmount() | number:'1.2-2' }}</strong>
            </div>

            <div class="summary-line">
              <span>Delivery Charges</span>
              <span *ngIf="cartService.deliveryFee() > 0" class="badge" style="background: #fef3c7; color: #b45309; font-weight: 700;">
                ₹{{ cartService.deliveryFee() | number:'1.2-2' }}
              </span>
              <span *ngIf="cartService.deliveryFee() === 0" class="badge badge-success">
                FREE
              </span>
            </div>

            <div class="delivery-threshold-notice" *ngIf="cartService.deliveryFee() > 0" style="font-size: 0.78rem; color: #d97706; background: #fffbeb; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px dashed #f59e0b; line-height: 1.35;">
              <i class="bi bi-info-circle me-1"></i> Orders under ₹500 include a flat ₹60 delivery fee.
            </div>
            <div class="delivery-threshold-notice" *ngIf="cartService.deliveryFee() === 0" style="font-size: 0.78rem; color: #047857; background: #ecfdf5; padding: 0.45rem 0.65rem; border-radius: 6px; border: 1px dashed #10b981; line-height: 1.35;">
              <i class="bi bi-check-circle-fill text-success me-1"></i> FREE Doorstep Delivery applied (orders over ₹500)!
            </div>

            <div class="summary-divider"></div>

            <div class="summary-line total-line">
              <span>Grand Total</span>
              <span class="grand-total-amount">₹{{ cartService.totalAmount() | number:'1.2-2' }}</span>
            </div>

            <button
              type="button"
              class="btn btn-accent btn-lg place-order-btn"
              [disabled]="isSubmitting || !selectedAddressId || (selectedPaymentMethod === 'WALLET' && isWalletBalanceInsufficient())"
              (click)="onPlaceOrder()"
            >
              <span *ngIf="!isSubmitting"><i class="bi bi-check2-circle me-1"></i> Confirm & Place Order</span>
              <span *ngIf="isSubmitting">Placing Your Order...</span>
            </button>

            <p class="terms-note">
              By placing this order, you agree to the EShopping Zone Terms & Conditions and Return Policy.
            </p>
          </div>
        </div>
      </div>

      <ng-template #noItems>
        <div class="no-items-card card">
          <h3>Your cart is empty</h3>
          <p>Please add items to your cart before proceeding to checkout.</p>
          <a routerLink="/products" class="btn btn-primary" style="margin-top: 1rem;">Browse Products</a>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .checkout-page {
      padding: 2.5rem 1.25rem 5rem;
    }
    .checkout-heading {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 2rem;
      color: var(--text-primary);
    }
    .checkout-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: flex-start;
    }

    .steps-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border-subtle);
    }
    .step-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .step-number {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background: var(--primary-600);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-header h3 { font-size: 1.15rem; font-weight: 700; }
    .step-body { padding: 1.5rem; }

    /* Addresses Grid */
    .addresses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .address-option-card {
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: flex;
      gap: 0.75rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      background: #ffffff;
    }
    .address-option-card:hover { border-color: var(--primary-300); }
    .address-option-card.selected {
      border-color: var(--primary-600);
      background: var(--primary-50);
    }
    .radio-indicator {
      width: 18px;
      height: 18px;
      border-radius: var(--radius-full);
      border: 2px solid var(--border-strong);
      margin-top: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .address-option-card.selected .radio-indicator { border-color: var(--primary-600); }
    .radio-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background: var(--primary-600);
    }
    .addr-tags { display: flex; gap: 0.35rem; margin-bottom: 0.35rem; }
    .address-details strong { font-size: 0.95rem; display: block; margin-bottom: 0.2rem; }
    .address-details p { font-size: 0.85rem; margin: 0; }
    .address-details small { font-size: 0.75rem; color: var(--text-muted); }

    .new-addr-form {
      background: var(--bg-subtle);
      padding: 1.25rem;
      border-radius: var(--radius-lg);
      margin-top: 1rem;
      border: 1px solid var(--border-subtle);
    }
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* Payment Methods */
    .payment-methods-list { display: flex; flex-direction: column; gap: 1rem; }
    .payment-option-card {
      border: 2px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .payment-option-card.selected {
      border-color: var(--primary-600);
      background: var(--primary-50);
    }
    .method-info { flex: 1; }
    .method-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    .method-desc { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }
    .wallet-balance-alert {
      background: var(--warning-bg);
      color: var(--warning-text);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      margin-top: 0.75rem;
    }
    .topup-inline-link {
      font-weight: 800;
      color: var(--primary-700);
      text-decoration: underline;
      margin-left: 0.35rem;
    }

    /* Summary Box */
    .summary-box {
      padding: 1.75rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .summary-box h3 { font-size: 1.25rem; font-weight: 800; }
    .order-items-mini {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-subtle);
      max-height: 180px;
      overflow-y: auto;
    }
    .mini-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
    }
    .mini-qty { color: var(--text-muted); font-weight: 700; width: 25px; }
    .mini-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem; }
    .mini-price { font-weight: 700; }

    .summary-line { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary); }
    .summary-divider { height: 1px; background: var(--border-subtle); margin: 0.5rem 0; }
    .total-line { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
    .grand-total-amount { font-size: 1.6rem; color: var(--primary-700); }
    .place-order-btn { width: 100%; margin-top: 0.5rem; }
    .terms-note { font-size: 0.75rem; color: var(--text-muted); text-align: center; line-height: 1.4; }

    .no-items-card { padding: 3rem; text-align: center; background: #ffffff; }

    @media (max-width: 850px) {
      .checkout-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CheckoutComponent implements OnInit {
  addresses = signal<AddressDto[]>([]);
  selectedAddressId: number | null = null;
  selectedPaymentMethod: PaymentMethod = 'WALLET';

  showNewAddressForm: boolean = false;
  isSavingAddress: boolean = false;
  isSubmitting: boolean = false;

  addressForm!: FormGroup;

  constructor(
    public cartService: CartService,
    public walletService: WalletService,
    private profileService: ProfileService,
    private orderService: OrderService,
    private toast: ToastService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.addressForm = this.fb.group({
      streetAddress: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      postalCode: ['', [Validators.required, Validators.pattern('^[0-9]{5,10}$')]],
      country: ['India', [Validators.required]],
      addressType: ['HOME']
    });

    this.cartService.loadCart().subscribe();
    this.walletService.getWallet().subscribe({ error: () => {} });

    this.profileService.getAddresses().subscribe({
      next: (addrs) => {
        this.addresses.set(addrs);
        const def = addrs.find(a => a.isDefault);
        if (def && def.id) {
          this.selectedAddressId = def.id;
        } else if (addrs.length > 0 && addrs[0].id) {
          this.selectedAddressId = addrs[0].id;
        }
      },
      error: () => {}
    });
  }

  selectAddress(id: number): void {
    this.selectedAddressId = id;
  }

  toggleNewAddressForm(): void {
    this.showNewAddressForm = !this.showNewAddressForm;
  }

  saveNewAddress(): void {
    if (this.addressForm.invalid) return;

    this.isSavingAddress = true;
    this.profileService.addAddress(this.addressForm.value).subscribe({
      next: (newAddr) => {
        this.isSavingAddress = false;
        this.showNewAddressForm = false;
        this.addresses.update(list => [...list, newAddr]);
        if (newAddr.id) this.selectedAddressId = newAddr.id;
        this.toast.success('Address saved.');
      },
      error: () => {
        this.isSavingAddress = false;
      }
    });
  }

  isWalletBalanceInsufficient(): boolean {
    const balance = this.walletService.wallet()?.balance ?? 0;
    const total = this.cartService.totalAmount();
    return balance < total;
  }

  onPlaceOrder(): void {
    if (!this.selectedAddressId) {
      this.toast.warning('Please select a shipping address');
      return;
    }

    const cart = this.cartService.cart();
    if (!cart || !cart.items.length) {
      this.toast.error('Your cart is empty');
      return;
    }

    if (this.selectedPaymentMethod === 'WALLET' && this.isWalletBalanceInsufficient()) {
      this.toast.error('Insufficient wallet balance. Please top up your wallet or choose another payment method.');
      return;
    }

    this.isSubmitting = true;

    const selectedAddr = this.addresses().find(a => a.id === this.selectedAddressId);
    const addressSnapshot = selectedAddr 
      ? `${selectedAddr.streetAddress}, ${selectedAddr.city}, ${selectedAddr.state}, ${selectedAddr.country} - ${selectedAddr.postalCode}`
      : undefined;

    const request: OrderCreateRequest = {
      shippingAddressId: this.selectedAddressId,
      shippingAddressSnapshot: addressSnapshot,
      paymentMethod: this.selectedPaymentMethod,
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    };

    this.orderService.checkout(request).subscribe({
      next: (order) => {
        this.isSubmitting = false;
        this.walletService.refreshLocalState();
        this.cartService.clearCart().subscribe();
        this.router.navigate(['/order-success', order.id]);
      },
      error: (err) => {
        this.isSubmitting = false;
      }
    });
  }
}
