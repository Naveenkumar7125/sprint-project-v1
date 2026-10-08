import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest } from 'rxjs';
import { ProductService, ProductFilterCriteria } from '../../../core/services/product.service';
import { ProductDto, CategoryDto } from '../../../core/models/product.models';
import { ProductCardComponent } from '../../../shared/components/product-card/product-card.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCardComponent,
    PaginationComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="catalog-page container">
      <!-- Breadcrumb & Title Header -->
      <div class="catalog-header">
        <div class="header-main">
          <nav class="breadcrumb">
            <a routerLink="/">Home</a>
            <span>/</span>
            <a routerLink="/products" *ngIf="currentCategory">Catalog</a>
            <span *ngIf="currentCategory">/</span>
            <span class="active-crumb">{{ pageTitle }}</span>
          </nav>
          <div class="title-row">
            <h1 class="page-heading">{{ pageTitle }}</h1>
            <span class="results-badge" *ngIf="!isLoading()">
              {{ totalElements() }} {{ totalElements() === 1 ? 'product' : 'products' }} found
            </span>
          </div>
        </div>

        <!-- Controls: Mobile Filter Toggle + Sort By Dropdown -->
        <div class="header-controls">
          <button class="btn btn-outline mobile-filter-btn" (click)="toggleMobileFilter()">
            <i class="bi bi-sliders me-1"></i> Filters {{ activeFilterCount() > 0 ? '(' + activeFilterCount() + ')' : '' }}
          </button>

          <div class="sort-box">
            <label for="sortSelect" class="sort-label">Sort by:</label>
            <div class="sort-select-wrapper">
              <select
                id="sortSelect"
                [(ngModel)]="selectedSort"
                (change)="onSortChange()"
                class="form-select sort-select"
              >
                <option value="createdAt,desc">Newest Arrivals</option>
                <option value="price,asc">Price: Low to High</option>
                <option value="price,desc">Price: High to Low</option>
                <option value="name,asc">Name: A to Z</option>
                <option value="name,desc">Name: Z to A</option>
                <option value="rating,desc">⭐ Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Filters Pill Bar -->
      <div class="active-filters-bar" *ngIf="hasActiveFilters()">
        <span class="active-filters-label">Active Filters:</span>
        <div class="filter-pills">
          <span class="filter-pill" *ngIf="currentCategory">
            Category: <strong>{{ currentCategory }}</strong>
            <button type="button" class="pill-remove" (click)="clearCategory()">×</button>
          </span>

          <span class="filter-pill" *ngIf="searchKeyword">
            Search: <strong>"{{ searchKeyword }}"</strong>
            <button type="button" class="pill-remove" (click)="clearSearch()">×</button>
          </span>

          <span class="filter-pill" *ngIf="minPrice || maxPrice">
            Price: <strong>{{ formatPriceRange() }}</strong>
            <button type="button" class="pill-remove" (click)="clearPriceFilter()">×</button>
          </span>

          <span class="filter-pill" *ngIf="minRating">
            Rating: <strong>{{ minRating }} Stars & up</strong>
            <button type="button" class="pill-remove" (click)="setRating(null)">×</button>
          </span>

          <span class="filter-pill" *ngIf="inStockOnly">
            <strong>In Stock Only</strong>
            <button type="button" class="pill-remove" (click)="toggleInStock(false)">×</button>
          </span>

          <button type="button" class="clear-all-link" (click)="resetAllFilters()">
            Reset All
          </button>
        </div>
      </div>

      <div class="catalog-layout">
        <!-- Sidebar Filters -->
        <aside class="catalog-sidebar" [class.mobile-open]="isMobileFilterOpen">
          <div class="filter-card card">
            <div class="filter-card-header">
              <h3 class="filter-card-title">Filter Catalog</h3>
              <button
                *ngIf="hasActiveFilters()"
                type="button"
                class="btn-text-clear"
                (click)="resetAllFilters()"
              >
                Clear All
              </button>
              <button
                type="button"
                class="mobile-close-btn"
                (click)="toggleMobileFilter()"
              >
                <i class="bi bi-x-lg"></i>
              </button>
            </div>

            <!-- Categories Section -->
            <div class="filter-group">
              <h4 class="filter-heading">Categories</h4>
              <ul class="category-filter-list">
                <li>
                  <button
                    type="button"
                    class="cat-filter-btn"
                    [class.active]="!currentCategory"
                    (click)="selectCategory(null)"
                  >
                    <span>All Categories</span>
                  </button>
                </li>
                <li *ngFor="let cat of categories()">
                  <button
                    type="button"
                    class="cat-filter-btn"
                    [class.active]="currentCategory === cat.name"
                    (click)="selectCategory(cat.name)"
                  >
                    <span>{{ cat.name }}</span>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Price Range Filter -->
            <div class="filter-group">
              <h4 class="filter-heading">Price Range (₹)</h4>

              <!-- Quick Price Presets -->
              <div class="price-presets">
                <button
                  type="button"
                  class="preset-chip"
                  [class.active]="isPricePresetActive(0, 2000)"
                  (click)="setPricePreset(0, 2000)"
                >
                  Under ₹2k
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.active]="isPricePresetActive(2000, 10000)"
                  (click)="setPricePreset(2000, 10000)"
                >
                  ₹2k - ₹10k
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.active]="isPricePresetActive(10000, 50000)"
                  (click)="setPricePreset(10000, 50000)"
                >
                  ₹10k - ₹50k
                </button>
                <button
                  type="button"
                  class="preset-chip"
                  [class.active]="isPricePresetActive(50000, null)"
                  (click)="setPricePreset(50000, null)"
                >
                  ₹50k+
                </button>
              </div>

              <!-- Custom Inputs -->
              <div class="price-inputs">
                <div class="input-with-symbol">
                  <span class="symbol">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    [(ngModel)]="minPrice"
                    (keyup.enter)="applyPriceFilter()"
                    class="form-control price-input"
                  />
                </div>
                <span class="to-separator">to</span>
                <div class="input-with-symbol">
                  <span class="symbol">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    [(ngModel)]="maxPrice"
                    (keyup.enter)="applyPriceFilter()"
                    class="form-control price-input"
                  />
                </div>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-sm btn-apply-price"
                (click)="applyPriceFilter()"
              >
                Apply Price
              </button>
            </div>

            <!-- Customer Rating Filter -->
            <div class="filter-group">
              <h4 class="filter-heading">Customer Rating</h4>
              <div class="rating-filter-options">
                <button
                  type="button"
                  class="rating-option-btn"
                  [class.active]="minRating === null"
                  (click)="setRating(null)"
                >
                  All Ratings
                </button>
                <button
                  type="button"
                  class="rating-option-btn"
                  [class.active]="minRating === 4"
                  (click)="setRating(4)"
                >
                  <span class="text-warning"><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star"></i></span> & above (4.0+)
                </button>
                <button
                  type="button"
                  class="rating-option-btn"
                  [class.active]="minRating === 3"
                  (click)="setRating(3)"
                >
                  <span class="text-warning"><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star-fill"></i><i class="bi bi-star"></i><i class="bi bi-star"></i></span> & above (3.0+)
                </button>
              </div>
            </div>

            <!-- In-Stock Filter -->
            <div class="filter-group">
              <h4 class="filter-heading">Availability</h4>
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  [(ngModel)]="inStockOnly"
                  (change)="onFilterChanged()"
                />
                <span>In Stock & Ready to Ship</span>
              </label>
            </div>
          </div>
        </aside>

        <!-- Product Grid Area -->
        <main class="catalog-main">
          <!-- Loading State -->
          <app-skeleton-loader
            *ngIf="isLoading()"
            type="product"
            [count]="6"
          ></app-skeleton-loader>

          <ng-container *ngIf="!isLoading()">
            <!-- Products Grid -->
            <div class="grid-products" *ngIf="products().length > 0">
              <app-product-card
                *ngFor="let prod of products()"
                [product]="prod"
              ></app-product-card>
            </div>

            <!-- Empty State -->
            <app-empty-state
              *ngIf="products().length === 0"
              icon="bi-bag-x"
              title="No products match your filters"
              message="Try adjusting your sort order, expanding your price range, or clearing filters."
              actionLabel="Reset All Filters"
              (actionClick)="resetAllFilters()"
            ></app-empty-state>

            <!-- Pagination -->
            <div class="pagination-wrapper" *ngIf="products().length > 0 && totalPages() > 1">
              <app-pagination
                [currentPage]="currentPage()"
                [totalPages]="totalPages()"
                (pageChange)="onPageChange($event)"
              ></app-pagination>
            </div>
          </ng-container>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .catalog-page {
      padding: 1.75rem 1.25rem 4rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-subtle, #e2e8f0);
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1.25rem;
    }

    .header-main {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted, #64748b);
    }
    .breadcrumb a {
      color: var(--text-secondary, #475569);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .breadcrumb a:hover {
      color: var(--primary-600, #4f46e5);
      text-decoration: underline;
    }
    .active-crumb {
      color: var(--text-primary, #0f172a);
      font-weight: 600;
    }

    .title-row {
      display: flex;
      align-items: baseline;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .page-heading {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--text-primary, #0f172a);
      letter-spacing: -0.02em;
      margin: 0;
    }

    .results-badge {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      background: var(--bg-subtle, #f1f5f9);
      color: var(--text-secondary, #475569);
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-filter-btn {
      display: none;
      padding: 0.5rem 0.85rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .sort-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sort-label {
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      font-weight: 600;
      white-space: nowrap;
    }

    .sort-select-wrapper {
      position: relative;
    }

    .sort-select {
      appearance: auto;
      min-width: 200px;
      padding: 0.5rem 0.85rem;
      border-radius: var(--radius-md, 8px);
      border: 1px solid var(--border-subtle, #cbd5e1);
      background-color: var(--bg-surface, #ffffff);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
      cursor: pointer;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }

    .sort-select:focus {
      outline: none;
      border-color: var(--primary-500, #6366f1);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    /* Active Filters Bar */
    .active-filters-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 0.75rem 1rem;
      background: var(--bg-subtle, #f8fafc);
      border: 1px solid var(--border-subtle, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      margin-bottom: 1.5rem;
    }

    .active-filters-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #64748b);
    }

    .filter-pills {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.25rem 0.6rem;
      background: var(--primary-50, #eef2ff);
      color: var(--primary-700, #4338ca);
      border: 1px solid var(--primary-200, #c7d2fe);
      border-radius: 9999px;
      font-size: 0.825rem;
    }

    .pill-remove {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      color: var(--primary-700, #4338ca);
      padding: 0 0.15rem;
      font-weight: 700;
    }
    .pill-remove:hover {
      color: var(--danger-600, #dc2626);
    }

    .clear-all-link {
      background: none;
      border: none;
      color: var(--primary-600, #4f46e5);
      font-size: 0.825rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: underline;
      padding: 0.25rem 0.5rem;
    }
    .clear-all-link:hover {
      color: var(--primary-800, #3730a3);
    }

    /* Layout */
    .catalog-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 2rem;
      align-items: flex-start;
    }

    /* Sidebar */
    .catalog-sidebar {
      position: sticky;
      top: 5rem;
    }

    .filter-card {
      background: var(--bg-surface, #ffffff);
      border: 1px solid var(--border-subtle, #e2e8f0);
      border-radius: var(--radius-lg, 12px);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .filter-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-subtle, #e2e8f0);
    }

    .filter-card-title {
      font-size: 1.05rem;
      font-weight: 800;
      margin: 0;
      color: var(--text-primary, #0f172a);
    }

    .btn-text-clear {
      background: none;
      border: none;
      color: var(--primary-600, #4f46e5);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-text-clear:hover {
      text-decoration: underline;
    }

    .mobile-close-btn {
      display: none;
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--text-secondary, #64748b);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-heading {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-primary, #0f172a);
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Categories List */
    .category-filter-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .cat-filter-btn {
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      padding: 0.45rem 0.65rem;
      border-radius: var(--radius-sm, 6px);
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cat-filter-btn:hover {
      background: var(--bg-subtle, #f1f5f9);
      color: var(--primary-600, #4f46e5);
    }

    .cat-filter-btn.active {
      background: var(--primary-50, #eef2ff);
      color: var(--primary-700, #4338ca);
      font-weight: 700;
    }

    /* Price Presets */
    .price-presets {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.4rem;
    }

    .preset-chip {
      padding: 0.35rem 0.5rem;
      border: 1px solid var(--border-subtle, #e2e8f0);
      background: var(--bg-subtle, #f8fafc);
      border-radius: var(--radius-sm, 6px);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: center;
    }

    .preset-chip:hover {
      border-color: var(--primary-300, #a5b4fc);
      color: var(--primary-600, #4f46e5);
    }

    .preset-chip.active {
      background: var(--primary-600, #4f46e5);
      border-color: var(--primary-600, #4f46e5);
      color: #ffffff;
    }

    /* Price Inputs */
    .price-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .input-with-symbol {
      position: relative;
      flex: 1;
    }

    .input-with-symbol .symbol {
      position: absolute;
      left: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }

    .price-input {
      padding-left: 1.25rem;
      font-size: 0.85rem;
      width: 100%;
    }

    .to-separator {
      font-size: 0.8rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }

    .btn-apply-price {
      width: 100%;
      font-weight: 600;
      padding: 0.4rem;
    }

    /* Rating Filter */
    .rating-filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .rating-option-btn {
      text-align: left;
      background: none;
      border: 1px solid transparent;
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm, 6px);
      font-size: 0.85rem;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .rating-option-btn:hover {
      background: var(--bg-subtle, #f1f5f9);
    }

    .rating-option-btn.active {
      background: var(--primary-50, #eef2ff);
      border-color: var(--primary-200, #c7d2fe);
      color: var(--primary-700, #4338ca);
      font-weight: 700;
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary, #475569);
      cursor: pointer;
      font-weight: 500;
    }

    .checkbox-label input[type="checkbox"] {
      cursor: pointer;
      width: 16px;
      height: 16px;
      accent-color: var(--primary-600, #4f46e5);
    }

    /* Main Area */
    .catalog-main {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
      padding-top: 1rem;
    }

    /* Responsive Design */
    @media (max-width: 900px) {
      .catalog-layout {
        grid-template-columns: 1fr;
      }

      .mobile-filter-btn {
        display: inline-flex;
      }

      .catalog-sidebar {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        background: rgba(15, 23, 42, 0.5);
        backdrop-filter: blur(4px);
        padding: 1.5rem;
        overflow-y: auto;
      }

      .catalog-sidebar.mobile-open {
        display: block;
      }

      .filter-card {
        max-width: 400px;
        margin: 2rem auto;
      }

      .mobile-close-btn {
        display: block;
      }
    }
  `]
})
export class ProductListComponent implements OnInit, OnDestroy {
  currentCategory: string | null = null;
  searchKeyword: string | null = null;
  selectedSort: string = 'createdAt,desc';

  // Filters
  minPrice: number | null = null;
  maxPrice: number | null = null;
  minRating: number | null = null;
  inStockOnly: boolean = false;

  isMobileFilterOpen: boolean = false;

  products = signal<ProductDto[]>([]);
  categories = signal<CategoryDto[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  totalElements = signal<number>(0);
  isLoading = signal<boolean>(true);

  private routeSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService
  ) {}

  get pageTitle(): string {
    if (this.currentCategory) {
      return this.currentCategory;
    }
    if (this.searchKeyword) {
      return `Search: "${this.searchKeyword}"`;
    }
    return 'All Products';
  }

  ngOnInit(): void {
    this.loadCategories();

    // Combine route params (/categories/:category) and queryParams (?search=...&sort=...&minPrice=...)
    this.routeSub = combineLatest([this.route.params, this.route.queryParams]).subscribe(
      ([params, qParams]) => {
        this.currentCategory = params['category'] || null;
        this.searchKeyword = qParams['search'] || qParams['query'] || null;

        if (qParams['sort']) {
          this.selectedSort = qParams['sort'];
        }
        if (qParams['minPrice']) {
          this.minPrice = Number(qParams['minPrice']) || null;
        }
        if (qParams['maxPrice']) {
          this.maxPrice = Number(qParams['maxPrice']) || null;
        }
        if (qParams['rating']) {
          this.minRating = Number(qParams['rating']) || null;
        }
        if (qParams['inStock']) {
          this.inStockOnly = qParams['inStock'] === 'true' || qParams['inStock'] === true;
        }

        const page = qParams['page'] ? Number(qParams['page']) : 0;
        this.loadProducts(page);
      }
    );
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  private loadCategories(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => {}
    });
  }

  loadProducts(page: number = 0): void {
    this.isLoading.set(true);
    this.currentPage.set(page);

    const criteria: ProductFilterCriteria = {
      page,
      size: 12,
      sort: this.selectedSort,
      category: this.currentCategory,
      query: this.searchKeyword,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      minRating: this.minRating,
      inStockOnly: this.inStockOnly
    };

    this.productService.getFilteredProducts(criteria).subscribe({
      next: (res) => this.handlePageResponse(res),
      error: () => this.isLoading.set(false)
    });
  }

  private handlePageResponse(page: any): void {
    this.products.set(page.content || []);
    this.currentPage.set(page.number || 0);
    this.totalPages.set(page.totalPages || 1);
    this.totalElements.set(page.totalElements || 0);
    this.isLoading.set(false);
  }

  // --- Interaction Handlers ---

  onSortChange(): void {
    this.updateQueryParams({ sort: this.selectedSort, page: 0 });
  }

  selectCategory(categoryName: string | null): void {
    this.isMobileFilterOpen = false;
    if (categoryName) {
      this.router.navigate(['/categories', categoryName], {
        queryParams: this.buildQueryParams({ page: 0 }),
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate(['/products'], {
        queryParams: this.buildQueryParams({ page: 0 }),
        queryParamsHandling: 'merge'
      });
    }
  }

  clearCategory(): void {
    this.selectCategory(null);
  }

  clearSearch(): void {
    this.searchKeyword = null;
    this.updateQueryParams({ search: null, query: null, page: 0 });
  }

  applyPriceFilter(): void {
    this.isMobileFilterOpen = false;
    this.updateQueryParams({
      minPrice: this.minPrice ? this.minPrice : null,
      maxPrice: this.maxPrice ? this.maxPrice : null,
      page: 0
    });
  }

  setPricePreset(min: number, max: number | null): void {
    this.minPrice = min;
    this.maxPrice = max;
    this.applyPriceFilter();
  }

  isPricePresetActive(min: number, max: number | null): boolean {
    if (max === null) {
      return this.minPrice === min && (this.maxPrice === null || this.maxPrice === undefined);
    }
    return this.minPrice === min && this.maxPrice === max;
  }

  clearPriceFilter(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.applyPriceFilter();
  }

  setRating(rating: number | null): void {
    this.minRating = rating;
    this.isMobileFilterOpen = false;
    this.updateQueryParams({ rating: this.minRating, page: 0 });
  }

  toggleInStock(inStock: boolean): void {
    this.inStockOnly = inStock;
    this.onFilterChanged();
  }

  onFilterChanged(): void {
    this.updateQueryParams({
      inStock: this.inStockOnly ? 'true' : null,
      page: 0
    });
  }

  resetAllFilters(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.minRating = null;
    this.inStockOnly = false;
    this.searchKeyword = null;
    this.selectedSort = 'createdAt,desc';
    this.isMobileFilterOpen = false;

    if (this.currentCategory) {
      this.router.navigate(['/products'], {
        queryParams: {}
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {}
      });
    }
  }

  hasActiveFilters(): boolean {
    return !!(
      this.currentCategory ||
      this.searchKeyword ||
      this.minPrice ||
      this.maxPrice ||
      this.minRating ||
      this.inStockOnly
    );
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.currentCategory) count++;
    if (this.searchKeyword) count++;
    if (this.minPrice || this.maxPrice) count++;
    if (this.minRating) count++;
    if (this.inStockOnly) count++;
    return count;
  }

  formatPriceRange(): string {
    if (this.minPrice && this.maxPrice) {
      return `₹${this.minPrice} - ₹${this.maxPrice}`;
    }
    if (this.minPrice) {
      return `Over ₹${this.minPrice}`;
    }
    if (this.maxPrice) {
      return `Under ₹${this.maxPrice}`;
    }
    return '';
  }

  toggleMobileFilter(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  onPageChange(page: number): void {
    this.updateQueryParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private updateQueryParams(params: Record<string, any>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }

  private buildQueryParams(extra: Record<string, any> = {}): Record<string, any> {
    const q: Record<string, any> = { ...extra };
    if (this.selectedSort && this.selectedSort !== 'createdAt,desc') q['sort'] = this.selectedSort;
    if (this.minPrice) q['minPrice'] = this.minPrice;
    if (this.maxPrice) q['maxPrice'] = this.maxPrice;
    if (this.minRating) q['rating'] = this.minRating;
    if (this.inStockOnly) q['inStock'] = 'true';
    if (this.searchKeyword) q['search'] = this.searchKeyword;
    return q;
  }
}
