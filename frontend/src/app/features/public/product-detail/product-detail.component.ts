import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { ReviewService } from '../../../core/services/review.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductDto } from '../../../core/models/product.models';
import { ReviewDto, ProductReviewSummaryDto } from '../../../core/models/review.models';
import { FrequentlyPurchasedTogetherDto } from '../../../core/models/recommendation.models';
import { ImageGalleryComponent } from '../../../shared/components/image-gallery/image-gallery.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ImageGalleryComponent,
    StarRatingComponent,
    SkeletonLoaderComponent
  ],
  template: `
    <div class="product-detail-page container" *ngIf="product(); else loadingTpl">
      <!-- Breadcrumb -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a>
        <span>/</span>
        <a routerLink="/products">Products</a>
        <span *ngIf="product()?.categoryName">/</span>
        <a *ngIf="product()?.categoryName" [routerLink]="['/categories', product()?.categoryName]">{{ product()?.categoryName }}</a>
        <span>/</span>
        <span class="active-crumb">{{ product()?.name }}</span>
      </nav>

      <!-- Main Product Display Grid -->
      <div class="product-showcase">
        <!-- Gallery Column -->
        <div class="gallery-col">
          <app-image-gallery
            [images]="galleryImages"
            [primaryImage]="product()?.imageUrl || ''"
            [altText]="product()?.name || ''"
          ></app-image-gallery>
        </div>

        <!-- Info & Buy Column -->
        <div class="info-col">
          <div class="product-badges">
            <span class="badge badge-primary">{{ product()?.categoryName || 'General' }}</span>
            <span *ngIf="product()?.active" class="badge" [ngClass]="availableStock() > 0 ? 'badge-success' : 'badge-danger'">
              {{ availableStock() > 0 ? 'In Stock (' + availableStock() + ' available)' : 'Out of Stock' }}
            </span>
            <span *ngIf="!product()?.active" class="badge badge-danger">
              <i class="bi bi-slash-circle me-1"></i> Inactive / Unavailable
            </span>
          </div>

          <h1 class="product-title">{{ product()?.name }}</h1>

          <!-- Inactive Alert Banner -->
          <div class="inactive-alert-banner" *ngIf="!product()?.active">
            <div class="inactive-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <div class="inactive-text">
              <strong>Product Currently Inactive</strong>
              <p>This item has been marked inactive by the seller and is not available for purchase or ordering.</p>
            </div>
          </div>

          <!-- Ratings Summary -->
          <div class="rating-bar">
            <div class="rating-pill-badge">
              <span class="rating-score">{{ computedRating | number:'1.1-1' }}</span>
              <span class="rating-star"><i class="bi bi-star-fill"></i></span>
            </div>
            <app-star-rating [rating]="computedRating"></app-star-rating>
            <span class="rating-count" *ngIf="totalRatingsCount > 0; else noReviewsText">
              {{ totalRatingsCount }} Verified Ratings & Reviews
            </span>
            <ng-template #noReviewsText>
              <span class="rating-count">No ratings yet</span>
            </ng-template>
          </div>

          <!-- Price Box -->
          <div class="price-box">
            <div class="current-price">
              <span class="currency">₹</span>
              <span class="amount">{{ product()?.price | number:'1.0-2' }}</span>
            </div>
            <div class="bank-offer-row">
              <span class="bank-tag">Bank Offer</span>
              <span class="bank-price">₹{{ bankOfferPrice | number:'1.0-2' }}</span>
              <span class="bank-desc">with Bank Offer (Extra 5% instant discount on select cards)</span>
            </div>
            <span class="tax-info">Inclusive of all authoritative taxes & fees</span>
          </div>

          <!-- Description -->
          <div class="desc-box">
            <h4>Description</h4>
            <p>{{ product()?.description }}</p>
          </div>

          <!-- Specifications Table -->
          <div class="specs-box" *ngIf="hasSpecifications()">
            <h4>Technical Specifications</h4>
            <div class="specs-table">
              <div class="spec-row" *ngFor="let spec of specEntries">
                <span class="spec-key">{{ spec.key }}</span>
                <span class="spec-val">{{ spec.value }}</span>
              </div>
            </div>
          </div>

          <!-- Quantity & Purchase Actions (Add to Cart & Buy Now) -->
          <div class="purchase-actions" *ngIf="product()?.active; else inactiveActionsTpl">
            <div class="quantity-picker">
              <button
                type="button"
                class="qty-btn"
                (click)="decreaseQty()"
                [disabled]="selectedQuantity <= 1"
              >
                -
              </button>
              <span class="qty-val">{{ selectedQuantity }}</span>
              <button
                type="button"
                class="qty-btn"
                (click)="increaseQty()"
                [disabled]="selectedQuantity >= availableStock()"
              >
                +
              </button>
            </div>

            <button
              class="btn btn-accent btn-lg add-btn"
              (click)="addToCart()"
              [disabled]="isAdding || isBuyingNow || availableStock() <= 0"
            >
              <span *ngIf="!isAdding"><i class="bi bi-cart-plus me-1"></i> Add to Cart</span>
              <span *ngIf="isAdding">Adding...</span>
            </button>

            <button
              class="btn btn-buy-now btn-lg buy-btn"
              (click)="buyNow()"
              [disabled]="isAdding || isBuyingNow || availableStock() <= 0"
            >
              <span *ngIf="!isBuyingNow"><i class="bi bi-lightning-charge me-1"></i> Buy Now</span>
              <span *ngIf="isBuyingNow">Processing...</span>
            </button>
          </div>

          <ng-template #inactiveActionsTpl>
            <div class="inactive-action-wrap">
              <button class="btn btn-secondary btn-lg disabled-buy-btn w-100" disabled>
                <i class="bi bi-slash-circle me-1"></i> Item Inactive — Currently Unavailable to Purchase
              </button>
            </div>
          </ng-template>
        </div>
      </div>


      <!-- Frequently Purchased Together Section -->
      <section class="section frequently-bought" *ngIf="frequentlyBoughtItems.length > 0">
        <div class="section-header-row mb-3">
          <h3 class="section-heading"><i class="bi bi-bag-check-fill text-primary me-2"></i> Frequently Purchased Together</h3>
          <p class="text-muted">Customers who bought this item also frequently purchased these items</p>
        </div>
        <div class="freq-grid">
          <div class="freq-card card card-shadow" *ngFor="let item of frequentlyBoughtItems">
            <a [routerLink]="['/products', item.productId]" class="freq-img-wrap">
              <img [src]="item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'" [alt]="item.name || item.productName" class="freq-img" />
              <div class="freq-rating-badge" *ngIf="(item.averageRating || item.rating || 0) > 0">
                <span class="score">{{ (item.averageRating || item.rating) | number:'1.1-1' }}</span>
                <i class="bi bi-star-fill star-icon"></i>
              </div>
            </a>
            <div class="freq-info">
              <h5 class="freq-title">
                <a [routerLink]="['/products', item.productId]">{{ item.name || item.productName }}</a>
              </h5>
              <div class="freq-price-row">
                <span class="freq-price">₹{{ item.price | number:'1.0-2' }}</span>
                <span class="freq-category badge badge-secondary" *ngIf="item.categoryName">{{ item.categoryName }}</span>
              </div>
              <div class="freq-actions mt-2">
                <a [routerLink]="['/products', item.productId]" class="btn btn-outline btn-sm w-100">
                  <i class="bi bi-eye me-1"></i> View Item
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Customer Reviews & Rating Section -->
      <section class="section reviews-section">
        <div class="reviews-header">
          <div>
            <h3 class="section-heading">Verified Customer Reviews</h3>
            <p>Read real experiences from buyers of this product</p>
          </div>
          <div class="review-action-wrap">
            <!-- Verified Buyer: Allowed to write review -->
            <button
              class="btn btn-primary"
              *ngIf="authService.isCustomer() && hasPurchased()"
              (click)="toggleReviewForm()"
            >
              <i class="bi bi-pencil-square me-1"></i> Write a Review (Verified Buyer)
            </button>

            <!-- Customer but not a buyer: Locked -->
            <div class="verified-buyer-lock" *ngIf="authService.isCustomer() && !hasPurchased() && !isCheckingPurchase()">
              <span class="lock-pill"><i class="bi bi-lock-fill me-1"></i> Verified Purchase Required</span>
              <span class="lock-subtext">Only customers who have purchased this product can submit a review.</span>
            </div>

            <!-- Guest -->
            <a
              [routerLink]="['/login']"
              [queryParams]="{ returnUrl: '/products/' + productId }"
              class="btn btn-outline btn-sm"
              *ngIf="!authService.isAuthenticated()"
            >
              <i class="bi bi-box-arrow-in-right me-1"></i> Sign in to Review
            </a>
          </div>
        </div>

        <!-- Review Submission Form -->
        <div class="review-form-card card animate-fade-in" *ngIf="showReviewForm">
          <h4>Submit Your Product Review</h4>
          <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
            <div class="form-group">
              <label class="form-label">Your Rating</label>
              <app-star-rating
                [rating]="reviewForm.value.rating"
                [interactive]="true"
                (ratingChange)="setReviewRating($event)"
              ></app-star-rating>
            </div>

            <div class="form-group">
              <label class="form-label" for="reviewTitle">Review Title</label>
              <input
                id="reviewTitle"
                type="text"
                formControlName="title"
                placeholder="e.g. Great build quality and battery life!"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="reviewComment">Detailed Review</label>
              <textarea
                id="reviewComment"
                rows="4"
                formControlName="comment"
                placeholder="Write your honest opinion about performance, features, and quality..."
                class="form-control"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="toggleReviewForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="reviewForm.invalid || isSubmittingReview">
                Submit Review
              </button>
            </div>
          </form>
        </div>

        <!-- Reviews List -->
        <div class="reviews-list" *ngIf="reviews().length > 0; else noReviewsTpl">
          <div class="review-card card" *ngFor="let rev of reviews()">
            <div class="rev-top">
              <div class="rev-author">
                <div class="author-avatar">{{ rev.customerUsername.charAt(0).toUpperCase() }}</div>
                <div>
                  <strong>{{ rev.customerUsername }}</strong>
                  <span class="verified-badge"><i class="bi bi-patch-check-fill me-1"></i> Verified Buyer</span>
                </div>
              </div>
              <span class="rev-date">{{ rev.createdAt | date:'mediumDate' }}</span>
            </div>

            <div class="rev-rating">
              <app-star-rating [rating]="rev.rating"></app-star-rating>
              <h5 class="rev-title">{{ rev.title }}</h5>
            </div>

            <p class="rev-comment">{{ rev.comment }}</p>
          </div>
        </div>

        <ng-template #noReviewsTpl>
          <div class="no-reviews-box">
            <p>No reviews yet for this product. Be the first to share your thoughts!</p>
          </div>
        </ng-template>
      </section>
    </div>

    <ng-template #loadingTpl>
      <div class="container" style="padding: 3rem 0;">
        <app-skeleton-loader type="product" [count]="1"></app-skeleton-loader>
      </div>
    </ng-template>
  `,
  styles: [`
    .product-detail-page {
      padding: 2rem 1.25rem 4rem;
    }
    .breadcrumb {
      display: flex;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .breadcrumb a:hover { color: var(--primary-600); }
    .active-crumb { color: var(--text-primary); font-weight: 600; }

    .product-showcase {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 3rem;
      margin-bottom: 4rem;
      align-items: flex-start;
    }
    .info-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .product-badges { display: flex; gap: 0.5rem; }
    .product-title {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--text-primary);
      line-height: 1.2;
    }

    .rating-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .rating-pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #ffffff;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(226, 232, 240, 0.9);
      line-height: 1;
    }
    .rating-score {
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
    }
    .rating-star {
      color: #16a34a; /* Vibrant Green star */
      font-size: 0.95rem;
      line-height: 1;
    }
    .rating-count { font-size: 0.875rem; color: var(--text-secondary); }

    .price-box {
      background: var(--bg-subtle);
      padding: 1.25rem 1.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .current-price {
      display: flex;
      align-items: baseline;
      gap: 3px;
      color: var(--text-primary);
    }
    .currency { font-size: 1.5rem; font-weight: 700; color: var(--primary-700); }
    .amount { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.02em; }
    .bank-offer-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
      flex-wrap: wrap;
    }
    .bank-tag {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      background: #2563eb;
      color: #ffffff;
      padding: 0.2rem 0.45rem;
      border-radius: 4px;
    }
    .bank-price {
      font-size: 1.15rem;
      font-weight: 800;
      color: #1d4ed8;
    }
    .bank-desc {
      font-size: 0.825rem;
      color: #1e40af;
      font-weight: 500;
    }
    .tax-info { font-size: 0.75rem; color: var(--text-muted); display: block; }

    .desc-box h4, .specs-box h4 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-primary);
    }
    .desc-box p { font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); }

    .specs-table {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .spec-row {
      display: flex;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.875rem;
    }
    .spec-row:last-child { border-bottom: none; }
    .spec-key { width: 35%; font-weight: 600; color: var(--text-secondary); }
    .spec-val { width: 65%; color: var(--text-primary); }

    .purchase-actions {
      display: flex;
      gap: 0.85rem;
      align-items: center;
      margin-top: 1.25rem;
      flex-wrap: wrap;
    }
    .quantity-picker {
      display: flex;
      align-items: center;
      border: 1.5px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: #ffffff;
      height: 48px;
    }
    .qty-btn {
      width: 38px;
      height: 100%;
      background: none;
      border: none;
      font-size: 1.25rem;
      font-weight: 700;
      cursor: pointer;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn:hover:not(:disabled) {
      background: var(--bg-subtle);
    }
    .qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .qty-val {
      width: 38px;
      text-align: center;
      font-weight: 700;
      font-size: 1.05rem;
    }
    .add-btn {
      flex: 1;
      min-width: 155px;
      height: 48px;
      background: linear-gradient(135deg, #ff9f00 0%, #f59e0b 100%);
      color: #ffffff;
      border: none;
      font-weight: 700;
      font-size: 0.95rem;
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .add-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    }
    .add-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    .buy-btn {
      flex: 1;
      min-width: 155px;
      height: 48px;
      background: linear-gradient(135deg, #fb641b 0%, #ef4444 100%);
      color: #ffffff;
      border: none;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: 0.02em;
      border-radius: var(--radius-md);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      box-shadow: 0 4px 14px rgba(251, 100, 27, 0.32);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .buy-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #f95200 0%, #dc2626 100%);
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(251, 100, 27, 0.45);
    }
    .buy-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .inactive-alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: var(--radius-md);
      margin: 1.25rem 0;
    }
    .inactive-icon {
      font-size: 1.4rem;
      line-height: 1;
    }
    .inactive-text strong {
      display: block;
      color: #991b1b;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }
    .inactive-text p {
      color: #b91c1c;
      font-size: 0.85rem;
      margin: 0;
      line-height: 1.4;
    }
    .inactive-action-wrap {
      margin-top: 1.5rem;
      margin-bottom: 2rem;
    }
    .disabled-buy-btn {
      height: 48px;
      font-size: 0.95rem;
      font-weight: 700;
      background: #f1f5f9 !important;
      color: #94a3b8 !important;
      border: 1.5px dashed #cbd5e1 !important;
      border-radius: var(--radius-md);
      cursor: not-allowed;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }


    /* Frequently Bought */
    .section-heading { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.35rem; color: var(--text-primary); }
    .freq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-bottom: 3.5rem;
    }
    .freq-card {
      padding: 1rem;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .freq-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.08);
    }
    .freq-img-wrap {
      position: relative;
      display: block;
      width: 100%;
      height: 160px;
      background: #f8fafc;
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .freq-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    .freq-card:hover .freq-img {
      transform: scale(1.05);
    }
    .freq-rating-badge {
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.15rem 0.4rem;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .star-icon {
      color: #16a34a;
      font-size: 0.75rem;
    }
    .freq-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .freq-title {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 0.35rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.4em;
    }
    .freq-title a { color: var(--text-primary); text-decoration: none; }
    .freq-title a:hover { color: var(--primary-600); }
    .freq-price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .freq-price { font-size: 1.1rem; font-weight: 800; color: #0f172a; }

    /* Reviews */
    .reviews-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    .review-action-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
    }
    .verified-buyer-lock {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }
    .lock-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
    }
    .lock-subtext {
      font-size: 0.75rem;
      color: var(--text-secondary);
      max-width: 280px;
      text-align: right;
    }
    .review-form-card {
      padding: 2rem;
      margin-bottom: 2rem;
      background: #ffffff;
      border: 1.5px solid var(--primary-200);
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .review-card {
      padding: 1.5rem;
      background: #ffffff;
    }
    .rev-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .rev-author { display: flex; align-items: center; gap: 0.75rem; }
    .author-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--primary-100);
      color: var(--primary-700);
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .verified-badge {
      display: block;
      font-size: 0.75rem;
      color: var(--success-text);
      font-weight: 600;
    }
    .rev-date { font-size: 0.8125rem; color: var(--text-muted); }
    .rev-rating { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .rev-title { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
    .rev-comment { font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; }
    .no-reviews-box {
      text-align: center;
      padding: 2.5rem;
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border-subtle);
      color: var(--text-secondary);
    }

    @media (max-width: 900px) {
      .product-showcase { grid-template-columns: 1fr; }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  productId!: number;
  product = signal<ProductDto | null>(null);
  availableStock = signal<number>(10);
  reviewSummary = signal<ProductReviewSummaryDto | null>(null);
  reviews = signal<ReviewDto[]>([]);
  frequentlyBought = signal<FrequentlyPurchasedTogetherDto | null>(null);

  hasPurchased = signal<boolean>(false);
  isCheckingPurchase = signal<boolean>(false);

  selectedQuantity: number = 1;
  isAdding: boolean = false;
  isBuyingNow: boolean = false;
  showReviewForm: boolean = false;
  isSubmittingReview: boolean = false;

  reviewForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private orderService: OrderService,
    private reviewService: ReviewService,
    private inventoryService: InventoryService,
    private recommendationService: RecommendationService,
    public authService: AuthService,
    private toast: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      comment: ['', [Validators.required, Validators.maxLength(1000)]]
    });

    this.route.params.subscribe(params => {
      this.productId = +params['id'];
      if (this.productId) {
        this.loadProductDetails();
      }
    });
  }

  get computedRating(): number {
    const summaryAvg = this.reviewSummary()?.averageRating;
    if (summaryAvg != null && summaryAvg > 0) return summaryAvg;
    const stats = this.reviewService.getRatingForProductSync(this.productId);
    if (stats.totalReviews > 0) return stats.averageRating;
    return this.product()?.rating || 0;
  }

  get totalRatingsCount(): number {
    const summaryTotal = this.reviewSummary()?.totalReviews;
    if (summaryTotal != null && summaryTotal > 0) return summaryTotal;
    const stats = this.reviewService.getRatingForProductSync(this.productId);
    if (stats.totalReviews > 0) return stats.totalReviews;
    return this.reviews().length;
  }

  get bankOfferPrice(): number {
    const prod = this.product();
    if (!prod) return 0;
    if (prod.bankOfferPrice) return prod.bankOfferPrice;
    const discount = Math.max(50, Math.round(prod.price * 0.04));
    return Math.max(1, Math.round(prod.price - discount));
  }

  private loadProductDetails(): void {
    this.productService.getProductById(this.productId).subscribe({
      next: (prod) => {
        this.product.set(prod);
      },
      error: () => this.toast.error('Product not found')
    });

    this.inventoryService.getInventory(this.productId).subscribe({
      next: (inv) => this.availableStock.set(inv.availableStock ?? inv.availableQuantity ?? 0),
      error: () => this.availableStock.set(0)
    });

    this.reviewService.getProductSummary(this.productId).subscribe({
      next: (summary) => this.reviewSummary.set(summary),
      error: () => {}
    });

    this.reviewService.getProductReviews(this.productId, 0, 10).subscribe({
      next: (page) => this.reviews.set(page.content),
      error: () => {}
    });

    this.recommendationService.getFrequentlyPurchasedTogether(this.productId, 4).subscribe({
      next: (res) => this.frequentlyBought.set(res),
      error: () => {}
    });

    if (this.authService.isAuthenticated() && this.authService.isCustomer()) {
      this.isCheckingPurchase.set(true);
      this.orderService.hasUserPurchasedProduct(this.productId).subscribe({
        next: (purchased) => {
          this.hasPurchased.set(purchased);
          this.isCheckingPurchase.set(false);
        },
        error: () => {
          this.hasPurchased.set(false);
          this.isCheckingPurchase.set(false);
        }
      });
    } else {
      this.hasPurchased.set(false);
      this.isCheckingPurchase.set(false);
    }
  }

  get galleryImages(): string[] {
    const prod = this.product();
    if (!prod) return [];
    const urls: string[] = [];
    if (prod.imageUrl) urls.push(prod.imageUrl);

    if (prod.specifications?.['galleryImages']) {
      try {
        const extra = JSON.parse(prod.specifications['galleryImages']);
        if (Array.isArray(extra)) urls.push(...extra);
      } catch {
        urls.push(prod.specifications['galleryImages']);
      }
    }
    return urls;
  }

  get specEntries(): { key: string; value: string }[] {
    const specs = this.product()?.specifications || {};
    return Object.entries(specs)
      .filter(([k]) => k !== 'galleryImages')
      .map(([key, value]) => ({ key, value }));
  }

  hasSpecifications(): boolean {
    return this.specEntries.length > 0;
  }

  increaseQty(): void {
    if (this.selectedQuantity < this.availableStock()) {
      this.selectedQuantity++;
    }
  }

  decreaseQty(): void {
    if (this.selectedQuantity > 1) {
      this.selectedQuantity--;
    }
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod || prod.active === false) {
      this.toast.error('This product is currently inactive and cannot be added to cart.');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please sign in to add products to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/products/' + this.productId } });
      return;
    }

    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can add items to the cart.');
      return;
    }

    this.isAdding = true;
    this.cartService.addItem(this.productId, this.selectedQuantity, this.product()).subscribe({
      next: () => {
        this.isAdding = false;
      },
      error: () => {
        this.isAdding = false;
      }
    });
  }

  buyNow(): void {
    const prod = this.product();
    if (!prod || prod.active === false) {
      this.toast.error('This product is currently inactive and cannot be purchased.');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please sign in to proceed directly to checkout.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }

    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can purchase products.');
      return;
    }

    this.isBuyingNow = true;
    this.cartService.addItem(this.productId, this.selectedQuantity, this.product()).subscribe({
      next: () => {
        this.isBuyingNow = false;
        this.router.navigate(['/checkout']);
      },
      error: () => {
        this.isBuyingNow = false;
        this.router.navigate(['/checkout']);
      }
    });
  }


  toggleReviewForm(): void {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please sign in to write a review.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/products/' + this.productId } });
      return;
    }
    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can write reviews.');
      return;
    }
    if (!this.hasPurchased()) {
      this.toast.error('Only customers who have purchased this product can leave a review.');
      return;
    }
    this.showReviewForm = !this.showReviewForm;
  }

  setReviewRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  get frequentlyBoughtItems(): any[] {
    const fb = this.frequentlyBought();
    if (!fb) return [];
    const items = (fb.frequentlyPurchasedItems || fb.frequentlyBoughtWith || []) as any[];
    return items.map(item => {
      const pId = item.productId || item.id;
      const stats = this.reviewService.getRatingForProductSync(pId);
      return {
        ...item,
        productId: pId,
        averageRating: item.averageRating || stats.averageRating,
        ratingCount: item.ratingCount || stats.totalReviews
      };
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) return;

    if (!this.hasPurchased()) {
      this.toast.error('Verification failed: Only verified buyers who purchased this product can submit a review.');
      return;
    }

    this.isSubmittingReview = true;
    const request = {
      productId: this.productId,
      ...this.reviewForm.value
    };

    this.reviewService.createReview(request).subscribe({
      next: (newReview) => {
        this.isSubmittingReview = false;
        this.showReviewForm = false;
        this.toast.success('Thank you! Your verified buyer review has been published.');
        this.reviews.update(list => [newReview, ...list]);
        this.reviewForm.reset({ rating: 5 });
        this.reviewService.getProductSummary(this.productId).subscribe(summary => {
          this.reviewSummary.set(summary);
        });
      },
      error: () => {
        this.isSubmittingReview = false;
      }
    });
  }
}
