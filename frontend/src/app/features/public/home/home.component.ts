import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductDto, CategoryDto } from '../../../core/models/product.models';
import { ProductRecommendationDto } from '../../../core/models/recommendation.models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ReviewService } from '../../../core/services/review.service';

export interface CategoryStripItem {
  name: string;
  categoryQuery: string;
  icon: string;
  image: string;
}

export interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  priceTag: string;
  oldPrice?: string;
  description: string;
  bgGradient: string;
  image: string;
  categoryLink: string;
  buttonText: string;
}

export interface DealItem {
  id: number;
  name: string;
  highlight: string;
  priceText: string;
  image: string;
  categoryQuery: string;
}

export interface PromoCard {
  tag: string;
  title: string;
  priceText: string;
  offerBadge: string;
  bankOffer: string;
  image: string;
  bgColor: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, SkeletonLoaderComponent],
  template: `
    <div class="flipkart-home-root">
      <div class="container-fluid page-container">
        <!-- 1. Top Category Bar (Smooth Carousel with Hidden Scrollbars) -->
        <section class="category-strip-card card-shadow">
          <div class="cat-carousel-container">
            <!-- Left Carousel Arrow -->
            <button
              class="cat-nav-btn cat-prev-btn"
              [class.visible]="canScrollCatLeft()"
              (click)="scrollCategories('left')"
              aria-label="Previous categories"
            >
              ‹
            </button>

            <!-- Scrollable Category Track -->
            <div
              #catStripContainer
              class="category-strip-content no-scrollbar"
              (scroll)="onCategoryScroll()"
            >
              <a
                *ngFor="let item of categoryStrip"
                [routerLink]="['/categories', item.categoryQuery]"
                class="cat-strip-item"
              >
                <div class="cat-img-wrap">
                  <img [src]="item.image" [alt]="item.name" class="cat-strip-img" loading="lazy" />
                </div>
                <span class="cat-strip-name">{{ item.name }}</span>
              </a>
            </div>

            <!-- Right Carousel Arrow -->
            <button
              class="cat-nav-btn cat-next-btn"
              [class.visible]="canScrollCatRight()"
              (click)="scrollCategories('right')"
              aria-label="Next categories"
            >
              ›
            </button>
          </div>
        </section>

        <!-- 2. Hero Promotional Banner Carousel -->
        <section class="hero-slider-section">
          <div class="slider-wrapper card-shadow">
            <div
              class="slide-item"
              *ngFor="let slide of heroSlides; let idx = index"
              [class.active]="currentSlideIndex() === idx"
              [style.background]="slide.bgGradient"
            >
              <div class="slide-content-grid">
                <div class="slide-text">
                  <span class="slide-tag">{{ slide.tag }}</span>
                  <h1 class="slide-title">{{ slide.title }}</h1>
                  <p class="slide-subtitle">{{ slide.subtitle }}</p>

                  <div class="slide-price-row">
                    <span class="slide-price">{{ slide.priceTag }}</span>
                    <span class="slide-old-price" *ngIf="slide.oldPrice">{{ slide.oldPrice }}</span>
                  </div>

                  <p class="slide-desc">{{ slide.description }}</p>

                  <div class="slide-action-row">
                    <a [routerLink]="['/categories', slide.categoryLink]" class="btn btn-slider-cta">
                      {{ slide.buttonText }} →
                    </a>
                  </div>
                </div>

                <div class="slide-media">
                  <img [src]="slide.image" [alt]="slide.title" class="slide-product-img" />
                </div>
              </div>
            </div>

            <!-- Slider Navigation Controls -->
            <button class="slider-arrow prev-arrow" (click)="prevSlide()" aria-label="Previous Slide">
              ‹
            </button>
            <button class="slider-arrow next-arrow" (click)="nextSlide()" aria-label="Next Slide">
              ›
            </button>

            <!-- Slider Dots -->
            <div class="slider-dots">
              <button
                *ngFor="let s of heroSlides; let idx = index"
                class="dot-btn"
                [class.active]="currentSlideIndex() === idx"
                (click)="goToSlide(idx)"
                [attr.aria-label]="'Go to slide ' + (idx + 1)"
              ></button>
            </div>
          </div>
        </section>

        <!-- 3. "Best of Electronics" Showcase Row -->
        <section class="deal-showcase-row card-shadow">
          <div class="deal-showcase-container">
            <!-- Left Header -->
            <div class="deal-showcase-header">
              <div class="deal-header-text">
                <h2 class="deal-showcase-title">Best Of Electronics</h2>
                <p class="deal-showcase-sub">Top Deals On Top Brands</p>
              </div>
              <a routerLink="/products" [queryParams]="{ category: 'Electronics & Gadgets' }" class="btn-view-all-circle" title="View All Electronics">
                <span class="view-all-text">VIEW ALL</span>
                <span class="arrow-circle">›</span>
              </a>
            </div>

            <!-- Horizontal Scrollable Deals with Smooth Navigation -->
            <div class="deals-carousel-wrapper">
              <button
                class="cat-nav-btn deal-prev-btn"
                [class.visible]="canScrollDealsLeft()"
                (click)="scrollDeals('left')"
                aria-label="Previous deals"
              >
                ‹
              </button>

              <div
                #dealsContainer
                class="deal-cards-scroll no-scrollbar"
                (scroll)="onDealsScroll()"
              >
                <a
                  *ngFor="let deal of electronicsDeals"
                  [routerLink]="['/categories', deal.categoryQuery]"
                  class="deal-item-card"
                >
                  <div class="deal-img-box">
                    <img [src]="deal.image" [alt]="deal.name" class="deal-img" loading="lazy" />
                  </div>
                  <div class="deal-info">
                    <h3 class="deal-name">{{ deal.name }}</h3>
                    <span class="deal-price">{{ deal.priceText }}</span>
                    <span class="deal-highlight">{{ deal.highlight }}</span>
                  </div>
                </a>
              </div>

              <button
                class="cat-nav-btn deal-next-btn"
                [class.visible]="canScrollDealsRight()"
                (click)="scrollDeals('right')"
                aria-label="Next deals"
              >
                ›
              </button>
            </div>

            <!-- Right Promotional Ad Tile -->
            <div class="showcase-promo-ad">
              <div class="ad-content">
                <div class="ad-badge"><i class="bi bi-airplane-fill me-1"></i> TRAVEL FEST</div>
                <h4 class="ad-title">Domestic & International Flights</h4>
                <p class="ad-desc">Flat <strong>₹800 OFF</strong> on First Booking</p>
                <a routerLink="/products" class="ad-link">Book Now →</a>
              </div>
              <img
                src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&auto=format&fit=crop&q=80"
                alt="Travel Promo"
                class="ad-bg-img"
              />
            </div>
          </div>
        </section>

        <!-- 4. RECOMMENDATION SERVICE SECTION (AI & Behavior Powered Recommendations) -->
        <section class="recommendations-section card-shadow">
          <div class="rec-section-header">
            <div class="rec-header-titles">
              <div class="rec-badge-wrap">
                <span class="rec-ai-badge"><i class="bi bi-stars me-1"></i> Personalized Recommendations</span>
                <span *ngIf="authService.isAuthenticated()" class="rec-user-tag">
                  Curated for <strong>{{ authService.currentUser()?.username }}</strong>
                </span>
              </div>
              <h2 class="section-title-main">Personalized Picks For You</h2>
              <p class="section-sub-main">Smart suggestions tailored to your shopping preferences, searches, and top trends</p>
            </div>

            <!-- Recommendation Type Tabs -->
            <div class="rec-tabs">
              <button
                class="rec-tab-btn"
                [class.active]="recommendationType() === 'USER'"
                (click)="switchRecommendationType('USER')"
              >
                <i class="bi bi-person-check-fill me-1"></i> For You
              </button>
              <button
                class="rec-tab-btn"
                [class.active]="recommendationType() === 'TRENDING'"
                (click)="switchRecommendationType('TRENDING')"
              >
                <i class="bi bi-graph-up-arrow me-1"></i> Trending Now
              </button>
              <button
                class="rec-tab-btn"
                [class.active]="recommendationType() === 'TOP_RATED'"
                (click)="switchRecommendationType('TOP_RATED')"
              >
                ⭐ Top Rated
              </button>
              <button
                class="rec-tab-btn"
                [class.active]="recommendationType() === 'MOST_SEARCHED'"
                (click)="switchRecommendationType('MOST_SEARCHED')"
              >
                <i class="bi bi-search me-1"></i> Most Searched
              </button>
            </div>
          </div>

          <!-- Recommendations Carousel / Grid -->
          <div class="rec-carousel-wrapper">
            <button
              class="cat-nav-btn rec-prev-btn"
              [class.visible]="canScrollRecLeft()"
              (click)="scrollRecommendations('left')"
              aria-label="Previous recommendations"
            >
              ‹
            </button>

            <div
              #recContainer
              class="rec-cards-track no-scrollbar"
              (scroll)="onRecScroll()"
            >
              <div
                *ngFor="let rec of recommendedProducts()"
                class="rec-card"
              >
                <!-- Recommendation Reason Badge -->
                <div class="rec-reason-badge">
                  <span class="reason-icon"><i class="bi bi-lightbulb-fill text-warning"></i></span>
                  <span class="reason-text">{{ rec.recommendationReason || 'Popular Choice' }}</span>
                </div>

                <!-- Product Image -->
                <a [routerLink]="['/products', rec.productId]" class="rec-img-box">
                  <img [src]="rec.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80'" [alt]="rec.name || rec.productName" class="rec-img" loading="lazy" />
                  <span class="rec-score-pill" *ngIf="getRecRating(rec) > 0">
                    <i class="bi bi-star-fill text-warning me-1"></i>{{ getRecRating(rec) | number:'1.1-1' }}
                    <span class="rec-count-mini text-muted ms-1" *ngIf="getRecReviewCount(rec) > 0">({{ getRecReviewCount(rec) }})</span>
                  </span>
                </a>

                <!-- Product Info -->
                <div class="rec-info">
                  <span class="rec-category">{{ rec.categoryName }}</span>
                  <h3 class="rec-name">
                    <a [routerLink]="['/products', rec.productId]" [title]="rec.name || rec.productName">{{ rec.name || rec.productName }}</a>
                  </h3>
                  
                  <div class="rec-price-row">
                    <span class="rec-price">₹{{ rec.price | number:'1.0-2' }}</span>
                    <span class="rec-bank-offer">Bank offer available</span>
                  </div>

                  <button
                    class="btn btn-primary btn-sm rec-cart-btn"
                    (click)="addRecToCart(rec, $event)"
                  >
                    <i class="bi bi-cart-plus me-1"></i> Add to Cart
                  </button>
                </div>
              </div>
            </div>

            <button
              class="cat-nav-btn rec-next-btn"
              [class.visible]="canScrollRecRight()"
              (click)="scrollRecommendations('right')"
              aria-label="Next recommendations"
            >
              ›
            </button>
          </div>
        </section>

        <!-- 5. Multi-Card Promo Offer Grid (Row 1: Smartphones, TVs, Laptops) -->
        <section class="promo-grid-section">
          <div class="promo-grid-3">
            <div
              *ngFor="let card of promoCardsRow1"
              class="promo-card card-shadow"
              [style.background]="card.bgColor"
            >
              <div class="promo-card-info">
                <span class="promo-tag-badge">{{ card.tag }}</span>
                <h3 class="promo-card-title">{{ card.title }}</h3>
                <div class="promo-price-tag">{{ card.priceText }}</div>
                <span class="promo-offer-pill" *ngIf="card.offerBadge">{{ card.offerBadge }}</span>
                <div class="promo-bank-strip" *ngIf="card.bankOffer">
                  <span class="bank-icon"><i class="bi bi-credit-card"></i></span>
                  <span>{{ card.bankOffer }}</span>
                </div>
                <a [routerLink]="card.link" class="promo-cta-btn">Shop Now →</a>
              </div>
              <div class="promo-card-img-wrap">
                <img [src]="card.image" [alt]="card.title" class="promo-card-img" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <!-- 6. Multi-Card Promo Offer Grid (Row 2: Audio, Fashion, Home) -->
        <section class="promo-grid-section">
          <div class="promo-grid-3">
            <div
              *ngFor="let card of promoCardsRow2"
              class="promo-card card-shadow"
              [style.background]="card.bgColor"
            >
              <div class="promo-card-info">
                <span class="promo-tag-badge">{{ card.tag }}</span>
                <h3 class="promo-card-title">{{ card.title }}</h3>
                <div class="promo-price-tag">{{ card.priceText }}</div>
                <span class="promo-offer-pill" *ngIf="card.offerBadge">{{ card.offerBadge }}</span>
                <div class="promo-bank-strip" *ngIf="card.bankOffer">
                  <span class="bank-icon"><i class="bi bi-credit-card"></i></span>
                  <span>{{ card.bankOffer }}</span>
                </div>
                <a [routerLink]="card.link" class="promo-cta-btn">Explore Deals →</a>
              </div>
              <div class="promo-card-img-wrap">
                <img [src]="card.image" [alt]="card.title" class="promo-card-img" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <!-- 7. Category Tabs & Full Curated Catalog Grid -->
        <section class="products-showcase-section card-shadow">
          <div class="products-section-header">
            <div>
              <h2 class="section-title-main">Explore Full Marketplace</h2>
              <p class="section-sub-main">Verified top-rated products with express doorstep delivery</p>
            </div>

            <!-- Dynamic Category Filter Tabs -->
            <div class="category-tabs">
              <button
                class="cat-tab-btn"
                [class.active]="selectedCategoryTab() === 'ALL'"
                (click)="selectCategoryTab('ALL')"
              >
                All Products
              </button>
              <button
                *ngFor="let cat of availableCategories().slice(0, 6)"
                class="cat-tab-btn"
                [class.active]="selectedCategoryTab() === cat.name"
                (click)="selectCategoryTab(cat.name)"
              >
                {{ cat.name }}
              </button>
            </div>
          </div>

          <!-- Product Grid -->
          <app-skeleton-loader *ngIf="isLoading()" type="product" [count]="8"></app-skeleton-loader>

          <div class="flipkart-product-grid" *ngIf="!isLoading()">
            <app-product-card
              *ngFor="let prod of filteredProducts()"
              [product]="prod"
            ></app-product-card>
          </div>

          <div class="view-more-container" *ngIf="!isLoading()">
            <a routerLink="/products" class="btn btn-primary btn-lg load-more-link">
              Explore All 50+ Products in Catalog →
            </a>
          </div>
        </section>

        <!-- 8. Flipkart Trust & Assurance Footer Strip -->
        <section class="trust-banner-strip card-shadow">
          <div class="trust-grid">
            <div class="trust-item">
              <span class="trust-icon"><i class="bi bi-lightning-charge-fill"></i></span>
              <div>
                <strong>Express Delivery</strong>
                <small>Lightning fast doorstep dispatch</small>
              </div>
            </div>
            <div class="trust-item">
              <span class="trust-icon"><i class="bi bi-shield-check"></i></span>
              <div>
                <strong>100% Genuine Products</strong>
                <small>Directly sourced verified merchants</small>
              </div>
            </div>
            <div class="trust-item">
              <span class="trust-icon"><i class="bi bi-wallet2"></i></span>
              <div>
                <strong>Instant Wallet Checkout</strong>
                <small>1-Click instant balance payments</small>
              </div>
            </div>
            <div class="trust-item">
              <span class="trust-icon"><i class="bi bi-arrow-repeat"></i></span>
              <div>
                <strong>7-Day Easy Returns</strong>
                <small>Hassle-free replacement & refund</small>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .flipkart-home-root {
      background-color: #f1f2f4;
      padding: 0.75rem 0 3rem;
      min-height: 100vh;
    }
    .page-container {
      max-width: 1440px;
      margin: 0 auto;
      padding: 0 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .card-shadow {
      background: #ffffff;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      border: 1px solid #eaeaea;
    }

    /* 1. Category Carousel Strip */
    .category-strip-card {
      background: #ffffff;
      padding: 0.85rem 1rem;
      position: relative;
    }
    .cat-carousel-container {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .category-strip-content {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 1.5rem;
      width: 100%;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 0.25rem 0.5rem;
    }

    /* Carousel Navigation Chevrons */
    .cat-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      line-height: 1;
      color: #1e293b;
      cursor: pointer;
      z-index: 10;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
      pointer-events: none;
      user-select: none;
    }
    .cat-nav-btn.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .cat-nav-btn:hover {
      background: #2874f0;
      color: #ffffff;
      border-color: #2874f0;
      transform: translateY(-50%) scale(1.1);
      box-shadow: 0 6px 16px rgba(40, 116, 240, 0.35);
    }
    .cat-prev-btn { left: -8px; }
    .cat-next-btn { right: -8px; }

    .cat-strip-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      gap: 0.45rem;
      cursor: pointer;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      flex-shrink: 0;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }
    .cat-strip-item:hover {
      transform: translateY(-2px);
      background-color: #f8fafc;
    }
    .cat-img-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 5px rgba(0,0,0,0.04);
    }
    .cat-strip-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.25s ease;
    }
    .cat-strip-item:hover .cat-strip-img {
      transform: scale(1.1);
    }
    .cat-strip-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      text-align: center;
      white-space: nowrap;
    }

    /* 2. Hero Slider */
    .hero-slider-section {
      position: relative;
    }
    .slider-wrapper {
      position: relative;
      height: 280px;
      border-radius: 4px;
      overflow: hidden;
    }
    .slide-item {
      position: absolute;
      inset: 0;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.5s ease-in-out, visibility 0.5s ease-in-out;
      padding: 1.5rem 3.5rem;
      display: flex;
      align-items: center;
    }
    .slide-item.active {
      opacity: 1;
      visibility: visible;
      z-index: 2;
    }
    .slide-content-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      align-items: center;
      width: 100%;
      height: 100%;
      gap: 2rem;
    }
    .slide-text {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .slide-tag {
      display: inline-block;
      align-self: flex-start;
      background: rgba(255, 255, 255, 0.9);
      color: #1e293b;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .slide-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 0.25rem;
    }
    .slide-subtitle {
      font-size: 1rem;
      color: #475569;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .slide-price-row {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .slide-price {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
    }
    .slide-old-price {
      font-size: 1rem;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .slide-desc {
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1rem;
      max-width: 500px;
    }
    .btn-slider-cta {
      align-self: flex-start;
      background: #2874f0;
      color: #ffffff;
      font-weight: 700;
      padding: 0.55rem 1.35rem;
      border-radius: 4px;
      font-size: 0.9rem;
      box-shadow: 0 2px 6px rgba(40, 116, 240, 0.3);
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .btn-slider-cta:hover {
      background: #1a64dc;
      transform: translateY(-1px);
    }
    .slide-media {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }
    .slide-product-img {
      max-height: 230px;
      max-width: 100%;
      object-fit: contain;
      filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.15));
      border-radius: 8px;
    }

    .slider-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 88px;
      background: rgba(255, 255, 255, 0.85);
      border: none;
      font-size: 2.25rem;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);
      transition: background 0.2s ease;
    }
    .slider-arrow:hover { background: #ffffff; color: #2874f0; }
    .prev-arrow { left: 0; border-radius: 0 4px 4px 0; }
    .next-arrow { right: 0; border-radius: 4px 0 0 4px; }

    .slider-dots {
      position: absolute;
      bottom: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 0.5rem;
      z-index: 10;
    }
    .dot-btn {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.25);
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dot-btn.active {
      background: #2874f0;
      width: 24px;
      border-radius: 12px;
    }

    /* 3. "Best Of Electronics" Showcase Row */
    .deal-showcase-row {
      background: #ffffff;
      padding: 1rem;
    }
    .deal-showcase-container {
      display: grid;
      grid-template-columns: 210px 1fr 220px;
      gap: 1rem;
      align-items: stretch;
    }
    .deal-showcase-header {
      background: linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%);
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 1.5rem;
    }
    .deal-showcase-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
    }
    .deal-showcase-sub {
      font-size: 0.8rem;
      color: #64748b;
      margin-top: 0.25rem;
      font-weight: 600;
    }
    .btn-view-all-circle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #2874f0;
      color: #ffffff;
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.45rem 0.9rem;
      border-radius: 4px;
      transition: background 0.2s ease;
    }
    .btn-view-all-circle:hover { background: #1a64dc; }
    .arrow-circle {
      font-size: 1rem;
      font-weight: 800;
      line-height: 1;
    }

    .deals-carousel-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      min-width: 0;
    }
    .deal-cards-scroll {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      width: 100%;
      padding: 0.25rem 0.25rem;
    }
    .deal-prev-btn { left: -6px; }
    .deal-next-btn { right: -6px; }

    .deal-item-card {
      flex: 0 0 160px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background: #ffffff;
      text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .deal-item-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      border-color: #2874f0;
    }
    .deal-img-box {
      width: 100%;
      height: 130px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
    }
    .deal-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      transition: transform 0.25s ease;
    }
    .deal-item-card:hover .deal-img {
      transform: scale(1.06);
    }
    .deal-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      width: 100%;
    }
    .deal-name {
      font-size: 0.825rem;
      font-weight: 700;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 140px;
    }
    .deal-price {
      font-size: 0.875rem;
      font-weight: 800;
      color: #16a34a;
    }
    .deal-highlight {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* Right Promo Tile */
    .showcase-promo-ad {
      position: relative;
      border-radius: 4px;
      overflow: hidden;
      background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 1.25rem;
    }
    .ad-bg-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.35;
      mix-blend-mode: overlay;
    }
    .ad-content { position: relative; z-index: 2; }
    .ad-badge {
      font-size: 0.7rem;
      font-weight: 800;
      background: #fbbf24;
      color: #78350f;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      display: inline-block;
      margin-bottom: 0.5rem;
    }
    .ad-title {
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 0.35rem;
    }
    .ad-desc {
      font-size: 0.8rem;
      color: #e0e7ff;
      margin-bottom: 1rem;
    }
    .ad-link {
      display: inline-block;
      background: #ffffff;
      color: #4338ca;
      font-weight: 800;
      font-size: 0.8rem;
      padding: 0.4rem 0.85rem;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    /* 4. RECOMMENDATION SERVICE SECTION STYLES */
    .recommendations-section {
      background: #ffffff;
      padding: 1.35rem 1.5rem;
      position: relative;
    }
    .rec-section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1rem;
    }
    .rec-badge-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-bottom: 0.35rem;
    }
    .rec-ai-badge {
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      color: #4338ca;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      border: 1px solid #c7d2fe;
    }
    .rec-user-tag {
      font-size: 0.775rem;
      color: #64748b;
    }
    .rec-user-tag strong { color: #0f172a; }

    .rec-tabs {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .rec-tab-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.85rem;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .rec-tab-btn:hover { background: #e2e8f0; color: #0f172a; }
    .rec-tab-btn.active {
      background: #4f46e5;
      color: #ffffff;
      border-color: #4f46e5;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);
    }

    .rec-carousel-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .rec-cards-track {
      display: flex;
      gap: 1rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      width: 100%;
      padding: 0.35rem 0.25rem;
    }
    .rec-prev-btn { left: -8px; }
    .rec-next-btn { right: -8px; }

    .rec-card {
      flex: 0 0 230px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .rec-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.1);
      border-color: #818cf8;
    }
    .rec-reason-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: #fdf4ff;
      border: 1px solid #f5d0fe;
      color: #86198f;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.725rem;
      font-weight: 700;
      margin-bottom: 0.65rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .reason-icon { font-size: 0.75rem; }
    .reason-text { overflow: hidden; text-overflow: ellipsis; }

    .rec-img-box {
      position: relative;
      width: 100%;
      height: 160px;
      background: #f8fafc;
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.65rem;
    }
    .rec-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .rec-card:hover .rec-img { transform: scale(1.08); }
    .rec-score-pill {
      position: absolute;
      bottom: 6px;
      left: 6px;
      background: #16a34a;
      color: #ffffff;
      font-size: 0.725rem;
      font-weight: 800;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    .rec-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.25rem;
    }
    .rec-category {
      font-size: 0.7rem;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .rec-name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      min-height: 2.3em;
    }
    .rec-name a { color: inherit; }
    .rec-name a:hover { color: #2874f0; }

    .rec-price-row {
      display: flex;
      flex-direction: column;
      margin-top: auto;
      padding-top: 0.4rem;
      margin-bottom: 0.6rem;
    }
    .rec-price {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .rec-bank-offer {
      font-size: 0.725rem;
      color: #1d4ed8;
      font-weight: 600;
    }
    .rec-cart-btn {
      width: 100%;
      border-radius: 4px;
      font-size: 0.8rem;
      padding: 0.45rem 0.75rem;
    }

    /* 5 & 6. 3-Card Promo Offer Grid */
    .promo-grid-section {
      margin-top: 0.15rem;
    }
    .promo-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.85rem;
    }
    .promo-card {
      border-radius: 4px;
      padding: 1.25rem 1.35rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .promo-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
    }
    .promo-card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      z-index: 2;
    }
    .promo-tag-badge {
      font-size: 0.725rem;
      font-weight: 700;
      color: #475569;
    }
    .promo-card-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
    }
    .promo-price-tag {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
    }
    .promo-offer-pill {
      display: inline-block;
      align-self: flex-start;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 0.725rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .promo-bank-strip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #1e293b;
      background: rgba(255, 255, 255, 0.75);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      width: fit-content;
      margin-top: 0.2rem;
    }
    .promo-cta-btn {
      font-size: 0.8rem;
      font-weight: 700;
      color: #2874f0;
      margin-top: 0.4rem;
      display: inline-block;
    }
    .promo-cta-btn:hover { text-decoration: underline; }
    .promo-card-img-wrap {
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
    .promo-card-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
      transition: transform 0.25s ease;
    }
    .promo-card:hover .promo-card-img {
      transform: scale(1.08);
    }

    /* 7. Full Products Showcase Section */
    .products-showcase-section {
      background: #ffffff;
      padding: 1.5rem;
    }
    .products-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 1rem;
    }
    .section-title-main {
      font-size: 1.45rem;
      font-weight: 800;
      color: #0f172a;
    }
    .section-sub-main {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.2rem;
    }

    .category-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .cat-tab-btn {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      padding: 0.4rem 0.9rem;
      border-radius: var(--radius-full);
      font-size: 0.825rem;
      font-weight: 600;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .cat-tab-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .cat-tab-btn.active {
      background: #2874f0;
      color: #ffffff;
      border-color: #2874f0;
      box-shadow: 0 2px 6px rgba(40, 116, 240, 0.3);
    }

    .flipkart-product-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .view-more-container {
      margin-top: 2rem;
      text-align: center;
    }
    .load-more-link {
      background: #2874f0;
      color: #ffffff;
      font-weight: 700;
      padding: 0.75rem 2rem;
      border-radius: 4px;
      font-size: 0.95rem;
    }
    .load-more-link:hover { background: #1a64dc; }

    /* 8. Trust Banner */
    .trust-banner-strip {
      background: #ffffff;
      padding: 1.25rem 1.5rem;
    }
    .trust-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .trust-icon { font-size: 1.75rem; }
    .trust-item strong { display: block; font-size: 0.9rem; color: #0f172a; }
    .trust-item small { font-size: 0.775rem; color: #64748b; }

    /* Responsive Queries */
    @media (max-width: 1200px) {
      .deal-showcase-container { grid-template-columns: 180px 1fr; }
      .showcase-promo-ad { display: none; }
      .flipkart-product-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 900px) {
      .promo-grid-3 { grid-template-columns: 1fr; }
      .deal-showcase-container { grid-template-columns: 1fr; }
      .flipkart-product-grid { grid-template-columns: repeat(2, 1fr); }
      .trust-grid { grid-template-columns: repeat(2, 1fr); }
      .slide-content-grid { grid-template-columns: 1fr; }
      .slide-media { display: none; }
      .slider-wrapper { height: 240px; }
      .slide-title { font-size: 1.4rem; }
      .cat-prev-btn { left: 0; }
      .cat-next-btn { right: 0; }
    }

    @media (max-width: 600px) {
      .flipkart-product-grid { grid-template-columns: 1fr; }
      .trust-grid { grid-template-columns: 1fr; }
      .rec-card { flex: 0 0 190px; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('catStripContainer') catStripContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('dealsContainer') dealsContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('recContainer') recContainer!: ElementRef<HTMLDivElement>;

  canScrollCatLeft = signal<boolean>(false);
  canScrollCatRight = signal<boolean>(true);

  canScrollDealsLeft = signal<boolean>(false);
  canScrollDealsRight = signal<boolean>(true);

  canScrollRecLeft = signal<boolean>(false);
  canScrollRecRight = signal<boolean>(true);

  availableCategories = signal<CategoryDto[]>([]);
  allProducts = signal<ProductDto[]>([]);
  recommendedProducts = signal<ProductRecommendationDto[]>([]);
  recommendationType = signal<'USER' | 'TRENDING' | 'TOP_RATED' | 'MOST_SEARCHED'>('USER');

  selectedCategoryTab = signal<string>('ALL');
  isLoading = signal<boolean>(true);
  currentSlideIndex = signal<number>(0);

  private slideIntervalTimer: any = null;

  // 1. Flipkart Category Strip Data
  categoryStrip: CategoryStripItem[] = [
    {
      name: 'Grocery',
      categoryQuery: 'Home & Kitchen',
      icon: 'bi-basket',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Mobiles',
      categoryQuery: 'Electronics & Gadgets',
      icon: 'bi-phone',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Fashion',
      categoryQuery: 'Fashion & Apparel',
      icon: 'bi-gem',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Electronics',
      categoryQuery: 'Electronics & Gadgets',
      icon: 'bi-laptop',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Home & Furniture',
      categoryQuery: 'Home & Kitchen',
      icon: 'bi-house-door',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Audio & Sound',
      categoryQuery: 'Audio & Sound',
      icon: 'bi-headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Gaming & VR',
      categoryQuery: 'Gaming & VR',
      icon: 'bi-controller',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sports & Fitness',
      categoryQuery: 'Sports & Fitness',
      icon: 'bi-activity',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Beauty & Toys',
      categoryQuery: 'Beauty & Personal Care',
      icon: 'bi-stars',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Cameras & Drones',
      categoryQuery: 'Photography & Drones',
      icon: 'bi-camera',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Smartwatches',
      categoryQuery: 'Sports & Fitness',
      icon: '⌚',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80'
    },
    {
      name: 'Two Wheelers',
      categoryQuery: 'Sports & Fitness',
      icon: 'bi-speedometer',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=80'
    }
  ];

  // 2. Hero Rotating Slides
  heroSlides: HeroSlide[] = [
    {
      id: 1,
      tag: 'Big Launch Offer',
      title: 'Introducing New Quantum Laptops',
      subtitle: 'Big Performance in a Sleek, Lightweight Design',
      priceTag: 'From ₹24,999',
      oldPrice: '₹34,550',
      description: 'M3 Pro chip, 32GB unified memory, and 22-hour battery life encased in aerospace aluminum.',
      bgGradient: 'linear-gradient(135deg, #fce7f3 0%, #ede9fe 50%, #e0e7ff 100%)',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      categoryLink: 'Electronics & Gadgets',
      buttonText: 'Shop Laptops Now'
    },
    {
      id: 2,
      tag: 'Mega Smartphone Fest',
      title: 'Quantum Pro Max 5G 256GB',
      subtitle: '200MP Quad Camera & 120Hz Dynamic AMOLED',
      priceTag: 'From ₹27,999',
      oldPrice: '₹32,999',
      description: 'Snapdragon 8 Gen 3, 65W ultra-fast charging + ₹2,000 Instant Bank Discount.',
      bgGradient: 'linear-gradient(135deg, #e0f2fe 0%, #e0e7ff 50%, #f3e8ff 100%)',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
      categoryLink: 'Electronics & Gadgets',
      buttonText: 'Grab Smartphone'
    },
    {
      id: 3,
      tag: 'Sound Festival',
      title: 'SonicWave Studio ANC Headphones',
      subtitle: 'Hi-Res Spatial Audio with 40-Hour Battery Playtime',
      priceTag: 'From ₹1,499',
      oldPrice: '₹3,999',
      description: 'Industry-leading Active Noise Cancellation with dual custom 45mm beryllium drivers.',
      bgGradient: 'linear-gradient(135deg, #ffedd5 0%, #fee2e2 50%, #fef3c7 100%)',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      categoryLink: 'Audio & Sound',
      buttonText: 'Explore Audio'
    }
  ];

  // 3. "Best of Electronics" Carousel Items
  electronicsDeals: DealItem[] = [
    {
      id: 1,
      name: 'Noise Smartwatches',
      highlight: 'Top Rated',
      priceText: 'From ₹1,299',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Sports & Fitness'
    },
    {
      id: 2,
      name: 'Best True Wireless ANC',
      highlight: 'Grab Now',
      priceText: 'From ₹999',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Audio & Sound'
    },
    {
      id: 3,
      name: 'Ultra-Slim Monitors',
      highlight: 'Curved 175Hz',
      priceText: 'From ₹6,599',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Gaming & VR'
    },
    {
      id: 4,
      name: 'Bluetooth Speakers',
      highlight: '360° Spatial Sound',
      priceText: 'From ₹499',
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Audio & Sound'
    },
    {
      id: 5,
      name: 'Mirrorless Cameras',
      highlight: 'Shop Now!',
      priceText: 'From ₹24,999',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Photography & Drones'
    },
    {
      id: 6,
      name: 'Power Banks & Docks',
      highlight: '140W Fast Charging',
      priceText: 'From ₹799',
      image: 'https://images.unsplash.com/photo-1609592426815-581372dfcb17?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Electronics & Gadgets'
    },
    {
      id: 7,
      name: 'Gaming Keyboards',
      highlight: 'Hot-Swap RGB',
      priceText: 'From ₹1,499',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Gaming & VR'
    },
    {
      id: 8,
      name: 'Studio Microphones',
      highlight: '24-Bit / 192kHz',
      priceText: 'From ₹1,899',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&auto=format&fit=crop&q=80',
      categoryQuery: 'Audio & Sound'
    }
  ];

  // Curated Fallback Recommendations
  private fallbackRecommendations: Record<string, ProductRecommendationDto[]> = {
    USER: [
      {
        productId: 1,
        productName: 'Quantum Pro Max 5G Smartphone 256GB',
        categoryName: 'Electronics & Gadgets',
        price: 27999,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: '98% Match with Your Interests'
      },
      {
        productId: 13,
        productName: 'SonicWave Studio ANC Headphones',
        categoryName: 'Audio & Sound',
        price: 1499,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        score: 4.8,
        recommendationReason: 'Top Pick in High-Res Audio'
      },
      {
        productId: 2,
        productName: 'UltraBook Neo 16 OLED Creator Laptop',
        categoryName: 'Electronics & Gadgets',
        price: 24999,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: 'Similar to Viewed Workstations'
      },
      {
        productId: 31,
        productName: 'PulseGrip GPS Multisport Smartwatch',
        categoryName: 'Sports & Fitness',
        price: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
        score: 4.7,
        recommendationReason: 'Fast Selling in Fitness'
      },
      {
        productId: 7,
        productName: 'Chronograph Precision Automatic Watch',
        categoryName: 'Fashion & Apparel',
        price: 3499,
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
        score: 4.8,
        recommendationReason: 'Trending in Luxury Wear'
      },
      {
        productId: 25,
        productName: 'Barista Touch Espresso Machine',
        categoryName: 'Home & Kitchen',
        price: 4999,
        imageUrl: 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: 'Highly Rated for Modern Homes'
      }
    ],
    TRENDING: [
      {
        productId: 14,
        productName: 'PulseBuds Pro 2 ANC Earbuds',
        categoryName: 'Audio & Sound',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        score: 4.8,
        recommendationReason: '#1 Trending Earbuds this Week'
      },
      {
        productId: 22,
        productName: 'Predator Curved 34" 175Hz Monitor',
        categoryName: 'Gaming & VR',
        price: 6599,
        imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: 'High Surge in Cart Additions'
      },
      {
        productId: 8,
        productName: 'AeroGlide Elite Runner Sneakers',
        categoryName: 'Fashion & Apparel',
        price: 1850,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        score: 4.7,
        recommendationReason: 'Viral Fashion Favorite'
      },
      {
        productId: 44,
        productName: 'AlphaVision 33MP Mirrorless Camera',
        categoryName: 'Photography & Drones',
        price: 24999,
        imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: 'Trending Creator Gear'
      }
    ],
    TOP_RATED: [
      {
        productId: 1,
        productName: 'Quantum Pro Max 5G Smartphone',
        categoryName: 'Electronics & Gadgets',
        price: 27999,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        score: 4.95,
        recommendationReason: '⭐ 4.95 / 5.0 (2,400+ Verified Reviews)'
      },
      {
        productId: 2,
        productName: 'UltraBook Neo 16 OLED Laptop',
        categoryName: 'Electronics & Gadgets',
        price: 24999,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        score: 4.92,
        recommendationReason: '⭐ Best Rated Creator Machine'
      },
      {
        productId: 13,
        productName: 'SonicWave Studio ANC Headphones',
        categoryName: 'Audio & Sound',
        price: 1499,
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: '⭐ 99% Recommendation Rate'
      },
      {
        productId: 27,
        productName: 'RoboClean S9 Laser Robot Vacuum',
        categoryName: 'Home & Kitchen',
        price: 3999,
        imageUrl: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=800&q=80',
        score: 4.88,
        recommendationReason: '⭐ Top Rated Smart Appliance'
      }
    ],
    MOST_SEARCHED: [
      {
        productId: 1,
        productName: 'Quantum Pro Max 5G Smartphone',
        categoryName: 'Electronics & Gadgets',
        price: 27999,
        imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: '15,000+ Searches This Week'
      },
      {
        productId: 14,
        productName: 'PulseBuds Pro 2 ANC Wireless Earbuds',
        categoryName: 'Audio & Sound',
        price: 999,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        score: 4.8,
        recommendationReason: 'Most Searched in Audio'
      },
      {
        productId: 2,
        productName: 'UltraBook Neo 16 OLED Workstation',
        categoryName: 'Electronics & Gadgets',
        price: 24999,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        score: 4.9,
        recommendationReason: 'Breakout Search Query'
      },
      {
        productId: 31,
        productName: 'PulseGrip GPS Smartwatch',
        categoryName: 'Sports & Fitness',
        price: 1299,
        imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
        score: 4.7,
        recommendationReason: 'High Search Volume'
      }
    ]
  };

  // Promo Cards Row 1
  promoCardsRow1: PromoCard[] = [
    {
      tag: '*Addl. ₹2,000 Off on Exch.',
      title: 'Quantum 5G Flagship Smartphone',
      priceText: 'From ₹27,999*',
      offerBadge: 'Pay Only ₹4,667/m',
      bankOffer: 'OneCard 10% Instant Discount',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
      link: '/categories/Electronics & Gadgets'
    },
    {
      tag: 'Upto ₹20,000 Off on Exchange*',
      title: 'Top 4K Ultra HD Smart TV Deals',
      priceText: 'From ₹20,999',
      offerBadge: 'Dolby Vision & Atmos',
      bankOffer: 'HDFC Bank Flat ₹1,500 Off',
      image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      link: '/categories/Electronics & Gadgets'
    },
    {
      tag: 'Up to 12M No Cost EMI',
      title: 'Crazy Deals on Creator Laptops',
      priceText: 'From ₹19,990',
      offerBadge: 'Intel Core i7 / M3 Pro',
      bankOffer: 'ICICI Bank 10% Instant Off',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%)',
      link: '/categories/Electronics & Gadgets'
    }
  ];

  // Promo Cards Row 2
  promoCardsRow2: PromoCard[] = [
    {
      tag: 'Hero Offer of the Sale',
      title: 'Studio Wireless Headphones',
      priceText: 'From ₹1,499',
      offerBadge: 'Flat 65% Discount',
      bankOffer: 'Free Express Delivery',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      link: '/categories/Audio & Sound'
    },
    {
      tag: 'Brand Festival',
      title: 'Chronograph Luxury Watches',
      priceText: 'Min. 60% Off',
      offerBadge: 'Italian Leather & Steel',
      bankOffer: 'Axis Bank 10% Discount',
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #fae8ff 0%, #f5d0fe 100%)',
      link: '/categories/Fashion & Apparel'
    },
    {
      tag: 'Upgrade Your Home',
      title: 'Smart Kitchen & Espresso Makers',
      priceText: 'From ₹2,499',
      offerBadge: 'Up to 70% Off',
      bankOffer: 'Special Digital Wallet Cashback',
      image: 'https://images.unsplash.com/photo-1534432182912-63863115e106?w=300&auto=format&fit=crop&q=80',
      bgColor: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
      link: '/categories/Home & Kitchen'
    }
  ];

  public filteredProducts = computed(() => {
    const tab = this.selectedCategoryTab();
    const products = this.allProducts();
    if (tab === 'ALL') {
      return products.slice(0, 12);
    }
    return products.filter(p => p.categoryName?.toLowerCase() === tab.toLowerCase()).slice(0, 12);
  });

  constructor(
    private productService: ProductService,
    private recommendationService: RecommendationService,
    private cartService: CartService,
    public authService: AuthService,
    private reviewService: ReviewService,
    private toast: ToastService,
    private router: Router
  ) {}

  getRecRating(rec: ProductRecommendationDto): number {
    if (rec.averageRating != null && rec.averageRating > 0) return rec.averageRating;
    if (rec.rating != null && rec.rating > 0) return rec.rating;
    const stats = this.reviewService.getRatingForProductSync(rec.productId);
    if (stats.totalReviews > 0) return stats.averageRating;
    return rec.score && rec.score >= 1 && rec.score <= 5 ? rec.score : 0;
  }

  getRecReviewCount(rec: ProductRecommendationDto): number {
    if (rec.ratingCount != null && rec.ratingCount > 0) return rec.ratingCount;
    const stats = this.reviewService.getRatingForProductSync(rec.productId);
    return stats.totalReviews;
  }

  ngOnInit(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => this.availableCategories.set(cats),
      error: () => {}
    });

    this.productService.getAllProducts(0, 24).subscribe({
      next: (page) => {
        this.allProducts.set(page.content);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    // Load AI recommendations using RecommendationService
    this.loadRecommendations('USER');

    // Auto-advance hero slides every 5 seconds
    this.startSlideAutoPlay();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.onCategoryScroll();
      this.onDealsScroll();
      this.onRecScroll();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.slideIntervalTimer) {
      clearInterval(this.slideIntervalTimer);
    }
  }

  // Recommendation Service Integration
  switchRecommendationType(type: 'USER' | 'TRENDING' | 'TOP_RATED' | 'MOST_SEARCHED'): void {
    this.recommendationType.set(type);
    this.loadRecommendations(type);
  }

  loadRecommendations(type: 'USER' | 'TRENDING' | 'TOP_RATED' | 'MOST_SEARCHED'): void {
    let obs$;
    switch (type) {
      case 'USER':
        obs$ = this.authService.isAuthenticated()
          ? this.recommendationService.getUserPreferences(8)
          : this.recommendationService.getTrending(8);
        break;
      case 'TRENDING':
        obs$ = this.recommendationService.getTrending(8);
        break;
      case 'TOP_RATED':
        obs$ = this.recommendationService.getTopRated(8);
        break;
      case 'MOST_SEARCHED':
        obs$ = this.recommendationService.getMostSearched('7D', 8);
        break;
    }

    obs$.subscribe({
      next: (recs) => {
        if (recs && recs.length > 0) {
          this.recommendedProducts.set(recs);
        } else {
          this.recommendedProducts.set(this.fallbackRecommendations[type] || this.fallbackRecommendations['USER']);
        }
        setTimeout(() => this.onRecScroll(), 100);
      },
      error: () => {
        this.recommendedProducts.set(this.fallbackRecommendations[type] || this.fallbackRecommendations['USER']);
        setTimeout(() => this.onRecScroll(), 100);
      }
    });
  }

  addRecToCart(rec: ProductRecommendationDto, event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please sign in to add products to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can add items to the cart.');
      return;
    }

    this.cartService.addItem(rec.productId, 1, {
      id: rec.productId,
      name: rec.productName,
      price: rec.price,
      imageUrl: rec.imageUrl,
      categoryName: rec.categoryName
    }).subscribe({
      next: () => {
        this.toast.success(`"${rec.productName}" added to cart!`);
      },
      error: () => {}
    });
  }

  // Smooth Category Strip Scrolling
  onCategoryScroll(): void {
    if (!this.catStripContainer) return;
    const el = this.catStripContainer.nativeElement;
    this.canScrollCatLeft.set(el.scrollLeft > 10);
    this.canScrollCatRight.set(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  scrollCategories(direction: 'left' | 'right'): void {
    if (!this.catStripContainer) return;
    const el = this.catStripContainer.nativeElement;
    const scrollAmount = Math.max(260, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.onCategoryScroll(), 350);
  }

  // Smooth Deals Scrolling
  onDealsScroll(): void {
    if (!this.dealsContainer) return;
    const el = this.dealsContainer.nativeElement;
    this.canScrollDealsLeft.set(el.scrollLeft > 10);
    this.canScrollDealsRight.set(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  scrollDeals(direction: 'left' | 'right'): void {
    if (!this.dealsContainer) return;
    const el = this.dealsContainer.nativeElement;
    const scrollAmount = Math.max(300, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.onDealsScroll(), 350);
  }

  // Smooth Recommendations Scrolling
  onRecScroll(): void {
    if (!this.recContainer) return;
    const el = this.recContainer.nativeElement;
    this.canScrollRecLeft.set(el.scrollLeft > 10);
    this.canScrollRecRight.set(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  scrollRecommendations(direction: 'left' | 'right'): void {
    if (!this.recContainer) return;
    const el = this.recContainer.nativeElement;
    const scrollAmount = Math.max(280, Math.floor(el.clientWidth * 0.7));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.onRecScroll(), 350);
  }

  selectCategoryTab(categoryName: string): void {
    this.selectedCategoryTab.set(categoryName);
  }

  startSlideAutoPlay(): void {
    this.slideIntervalTimer = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  nextSlide(): void {
    this.currentSlideIndex.update(i => (i + 1) % this.heroSlides.length);
  }

  prevSlide(): void {
    this.currentSlideIndex.update(i => (i - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  goToSlide(idx: number): void {
    this.currentSlideIndex.set(idx);
  }
}
