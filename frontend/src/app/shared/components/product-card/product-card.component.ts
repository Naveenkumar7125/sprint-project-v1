import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductDto } from '../../../core/models/product.models';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { ReviewService } from '../../../core/services/review.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="product-card card">
      <!-- Category Badge -->
      <div class="card-badges" *ngIf="product.categoryName || !product.active">
        <span *ngIf="product.categoryName" class="badge badge-primary">{{ product.categoryName }}</span>
        <span *ngIf="!product.active" class="badge badge-danger">Inactive</span>
      </div>

      <!-- Product Image & Floating Rating Badge -->
      <a [routerLink]="['/products', product.id]" class="product-img-wrap">
        <img
          [src]="optimizedImageUrl"
          [alt]="product.name"
          loading="lazy"
          class="product-img"
          (error)="onImageError($event)"
        />

        <!-- Image-Overlaid Rating Badge (Real Calculated Review Score) -->
        <div class="rating-pill-badge" *ngIf="hasReviews; else newBadge">
          <span class="rating-score">{{ productRating | number:'1.1-1' }}</span>
          <span class="rating-star"><i class="bi bi-star-fill"></i></span>
          <span class="rating-count-mini" *ngIf="ratingStats.totalReviews > 0">({{ ratingStats.totalReviews }})</span>
        </div>
        <ng-template #newBadge>
          <div class="rating-pill-badge new-badge-pill">
            <span class="new-label"><i class="bi bi-stars me-1"></i> New</span>
          </div>
        </ng-template>
      </a>

      <!-- Card Body -->
      <div class="product-card-body">
        <h3 class="product-title">
          <a [routerLink]="['/products', product.id]" [title]="product.name">{{ product.name }}</a>
        </h3>

        <!-- Price & Bank Offer (Exact Flipkart / Reference Layout) -->
        <div class="product-price-section">
          <div class="main-price">
            ₹{{ product.price | number:'1.0-2' }}
          </div>
          <div class="bank-offer-row">
            <span class="bank-price">₹{{ bankOfferPrice | number:'1.0-2' }}</span>
            <span class="bank-offer-label">with Bank offer</span>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="product-footer">
          <button
            class="btn btn-primary btn-sm add-cart-btn w-100"
            (click)="addToCart($event)"
            [disabled]="isAdding || !product.active"
            [class.btn-disabled]="!product.active"
            aria-label="Add to cart"
          >
            <span *ngIf="!isAdding && product.active"><i class="bi bi-cart-plus me-1"></i> Add to Cart</span>
            <span *ngIf="!product.active"><i class="bi bi-slash-circle me-1"></i> Unavailable</span>
            <span *ngIf="isAdding" class="spinner-sm"></span>
          </button>
        </div>
      </div>
    </div>

  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      position: relative;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      height: 100%;
      overflow: hidden;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 28px -6px rgba(0, 0, 0, 0.12);
      border-color: var(--primary-200);
    }
    .card-badges {
      position: absolute;
      top: 0.65rem;
      left: 0.65rem;
      z-index: 3;
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .product-img-wrap {
      position: relative;
      display: block;
      width: 100%;
      padding-top: 80%; /* 4:3 Aspect Ratio */
      background: #f8fafc;
      overflow: hidden;
    }
    .product-img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.35s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.05);
    }

    /* Floating Pill Rating Badge */
    .rating-pill-badge {
      position: absolute;
      bottom: 0.65rem;
      left: 0.65rem;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #ffffff;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(226, 232, 240, 0.9);
      line-height: 1;
    }
    .rating-score {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
    }
    .rating-star {
      color: #16a34a; /* Vibrant Green star */
      font-size: 0.85rem;
      line-height: 1;
    }
    .rating-count-mini {
      font-size: 0.725rem;
      color: var(--text-secondary);
      font-weight: 600;
      margin-left: 2px;
    }
    .new-badge-pill {
      background: #f8fafc;
      border-color: #cbd5e1;
    }
    .new-label {
      font-size: 0.775rem;
      font-weight: 700;
      color: var(--primary-600);
    }

    .product-card-body {
      padding: 1rem 1.15rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin-bottom: 0.4rem;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.7em;
    }
    .product-title a {
      color: var(--text-primary);
      text-decoration: none;
    }
    .product-title a:hover {
      color: var(--primary-600);
    }

    .product-price-section {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      margin-bottom: 0.85rem;
    }
    .main-price {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .bank-offer-row {
      display: flex;
      align-items: baseline;
      gap: 0.35rem;
      font-size: 0.925rem;
      color: #1d4ed8; /* Blue brand highlight */
    }
    .bank-price {
      font-weight: 700;
      color: #1d4ed8;
    }
    .bank-offer-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: #1d4ed8;
    }

    .product-footer {
      margin-top: auto;
      padding-top: 0.5rem;
    }
    .add-cart-btn {
      width: 100%;
      padding: 0.55rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
    }
    .spinner-sm {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductDto;
  @Output() added = new EventEmitter<ProductDto>();

  isAdding: boolean = false;

  constructor(
    private cartService: CartService,
    public authService: AuthService,
    private router: Router,
    private toast: ToastService,
    private cloudinaryService: CloudinaryService,
    private reviewService: ReviewService
  ) {}

  get ratingStats(): { averageRating: number; totalReviews: number } {
    const sync = this.reviewService.getRatingForProductSync(this.product.id);
    if (sync.totalReviews > 0) return sync;
    const pAny = this.product as any;
    const avg = pAny.averageRating ?? this.product.rating ?? 0;
    const count = pAny.ratingCount ?? pAny.totalReviews ?? (avg > 0 ? 1 : 0);
    return { averageRating: avg, totalReviews: count };
  }

  get productRating(): number {
    return this.ratingStats.averageRating;
  }

  get hasReviews(): boolean {
    return this.ratingStats.averageRating > 0;
  }

  get bankOfferPrice(): number {
    if (this.product.bankOfferPrice) return this.product.bankOfferPrice;
    const discount = Math.max(50, Math.round(this.product.price * 0.04));
    return Math.max(1, Math.round(this.product.price - discount));
  }

  get optimizedImageUrl(): string {
    if (this.product.imageUrl) {
      return this.cloudinaryService.getOptimizedUrl(this.product.imageUrl, 400, 400);
    }
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';
  }

  onImageError(event: any): void {
    if (event.target && event.target.src && !event.target.src.includes('placeholder')) {
      event.target.src = 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&auto=format&fit=crop&q=80';
    }
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.product.active) {
      this.toast.error('This product is currently inactive and cannot be added to cart.');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please sign in to add products to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can add items to the cart.');
      return;
    }

    this.isAdding = true;

    this.cartService.addItem(this.product.id, 1, this.product).subscribe({
      next: () => {
        this.isAdding = false;
        this.added.emit(this.product);
      },
      error: () => {
        this.isAdding = false;
      }
    });
  }
}

