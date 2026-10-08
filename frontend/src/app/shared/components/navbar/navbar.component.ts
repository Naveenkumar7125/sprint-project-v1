import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryDto } from '../../../core/models/product.models';
import { LogoComponent } from '../logo/logo.component';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LogoComponent],
  template: `
    <header class="header-main">
      <!-- Top Announcement Bar -->
      <div class="top-bar">
        <div class="container top-bar-content">
          <div class="top-left">
            <span><i class="bi bi-lightning-charge-fill me-1"></i> Express Delivery Available on All Orders!</span>
          </div>
          <div class="top-right">
            <a routerLink="/track-delivery" class="top-link"><i class="bi bi-box-seam me-1"></i> Track Shipment</a>
            <span class="divider">|</span>
            <span *ngIf="authService.isAuthenticated()" class="top-link user-greet">
              Hello, <strong>{{ authService.currentUser()?.username }}</strong> ({{ authService.userRole() }})
            </span>
          </div>
        </div>
      </div>

      <!-- Main Navigation Header -->
      <nav class="nav-container">
        <div class="container nav-content">
          <!-- Logo -->
          <a routerLink="/" class="nav-brand" aria-label="EShopping Zone Home">
            <app-logo [height]="44"></app-logo>
          </a>

          <!-- Search Bar -->
          <div class="search-form-wrap">
            <form (ngSubmit)="onSearch()" class="search-form">
              <select
                [(ngModel)]="selectedCategory"
                name="category"
                class="search-category-select"
              >
                <option value="">All Categories</option>
                <option *ngFor="let cat of categories()" [value]="cat.name">
                  {{ cat.name }}
                </option>
              </select>

              <input
                type="text"
                [(ngModel)]="searchQuery"
                name="searchQuery"
                placeholder="Search 10,000+ products, electronics, apparel..."
                class="search-input"
                autocomplete="off"
              />

              <button type="submit" class="search-btn" aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>
          </div>

          <!-- Actions & Profile -->
          <div class="nav-actions">
            <!-- Digital Wallet Widget (for logged in customers) -->
            <a
              *ngIf="authService.isCustomer()"
              routerLink="/account/wallet"
              class="action-item wallet-chip"
              title="Your Digital Wallet Balance"
            >
              <span class="wallet-icon"><i class="bi bi-wallet2"></i></span>
              <div class="wallet-info">
                <span class="wallet-label">Wallet</span>
                <span class="wallet-amount">₹{{ walletService.wallet().balance | number:'1.2-2' }}</span>
              </div>
            </a>

            <!-- Notifications Bell (for logged in users) -->
            <a
              *ngIf="authService.isAuthenticated()"
              routerLink="/account/notifications"
              class="action-item notif-bell-btn"
              title="Notifications & Emails"
            >
              <div class="notif-icon-wrapper">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="notif-badge-pill" *ngIf="notificationService.unreadCount() > 0">
                  {{ notificationService.unreadCount() }}
                </span>
              </div>
              <span class="action-label d-none-mobile">Alerts</span>
            </a>

            <!-- Cart (for customers & guests) -->
            <a
              routerLink="/cart"
              class="action-item cart-btn"
              title="Shopping Cart"
            >
              <div class="cart-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span class="cart-badge" *ngIf="cartService.totalItems() > 0">
                  {{ cartService.totalItems() }}
                </span>
              </div>
              <span class="action-label d-none-mobile">Cart</span>
            </a>

            <!-- User Auth / Profile Dropdown -->
            <div class="profile-dropdown-wrapper" *ngIf="authService.isAuthenticated(); else guestButtons">
              <button
                class="action-item profile-trigger"
                (click)="toggleUserMenu()"
                [attr.aria-expanded]="isUserMenuOpen()"
              >
                <div class="avatar-circle">
                  {{ authService.currentUser()?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div class="user-meta d-none-mobile">
                  <span class="user-name">{{ authService.currentUser()?.username }}</span>
                  <span class="user-role-badge badge" [ngClass]="'badge-' + getRoleBadgeClass()">
                    {{ authService.userRole() }}
                  </span>
                </div>
                <span class="dropdown-caret">▼</span>
              </button>

              <!-- Dropdown Menu -->
              <div class="user-menu-dropdown animate-fade-in" *ngIf="isUserMenuOpen()">
                <div class="user-menu-header">
                  <strong>{{ authService.currentUser()?.username }}</strong>
                  <small>{{ authService.currentUser()?.email }}</small>
                </div>

                <div class="user-menu-links">
                  <!-- Customer Links -->
                  <ng-container *ngIf="authService.isCustomer()">
                    <a routerLink="/account/profile" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-person me-2"></i> My Profile</a>
                    <a routerLink="/account/orders" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-box-seam me-2"></i> My Orders</a>
                    <a routerLink="/account/wallet" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-wallet2 me-2"></i> Digital Wallet</a>
                    <a routerLink="/account/addresses" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-geo-alt me-2"></i> Saved Addresses</a>
                    <a routerLink="/account/notifications" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-bell me-2"></i> Notifications</a>
                  </ng-container>

                  <!-- Merchant Links -->
                  <ng-container *ngIf="authService.isMerchant()">
                    <a routerLink="/merchant/dashboard" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-speedometer2 me-2"></i> Merchant Dashboard</a>
                    <a routerLink="/merchant/products" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-tags me-2"></i> Product Catalog</a>
                    <a routerLink="/merchant/products/new" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-plus-circle me-2"></i> Add Product</a>
                    <a routerLink="/merchant/inventory" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-boxes me-2"></i> Stock & Inventory</a>
                  </ng-container>

                  <!-- Admin Links -->
                  <ng-container *ngIf="authService.isAdmin()">
                    <a routerLink="/admin/dashboard" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-shield-lock me-2"></i> Admin Dashboard</a>
                    <a routerLink="/admin/users" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-people me-2"></i> User Management</a>
                    <a routerLink="/admin/products" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-check2-circle me-2"></i> Product Moderation</a>
                    <a routerLink="/admin/orders" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-receipt me-2"></i> All Orders</a>
                    <a routerLink="/admin/delivery-assignment" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-truck me-2"></i> Delivery Dispatch</a>
                  </ng-container>

                  <!-- Delivery Agent Links -->
                  <ng-container *ngIf="authService.isDeliveryAgent()">
                    <a routerLink="/delivery/dashboard" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-bicycle me-2"></i> Delivery Dashboard</a>
                    <a routerLink="/delivery/available" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-inbox me-2"></i> Available Pickup Pool</a>
                    <a routerLink="/delivery/my-deliveries" (click)="closeUserMenu()" class="menu-link"><i class="bi bi-send me-2"></i> My Assigned Deliveries</a>
                  </ng-container>
                </div>

                <div class="user-menu-footer">
                  <button class="logout-btn" (click)="logout()">
                    <i class="bi bi-box-arrow-right me-2"></i> Logout
                  </button>
                </div>
              </div>
            </div>

            <!-- Guest Buttons -->
            <ng-template #guestButtons>
              <div class="guest-auth-buttons">
                <a routerLink="/login" class="btn btn-secondary btn-sm">Sign In</a>
                <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
              </div>
            </ng-template>

            <!-- Mobile Hamburger Toggle -->
            <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle Navigation">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Category Navigation Sub-bar (Smooth Carousel without scrollbars on non-home pages) -->
      <div class="categories-bar d-none-mobile" *ngIf="!isHomePage()">
        <div class="container nav-cat-carousel-container">
          <!-- Left Arrow -->
          <button
            class="nav-cat-arrow nav-cat-arrow-prev"
            [class.visible]="canScrollNavLeft()"
            (click)="scrollNavCategories('left')"
            aria-label="Previous categories"
          >
            ‹
          </button>

          <!-- Scrollable Track (Hidden Scrollbar) -->
          <div
            #navCatContent
            class="cat-content no-scrollbar"
            (scroll)="onNavCatScroll()"
          >
            <a routerLink="/products" class="cat-link all-products">
              <span class="cat-icon"><i class="bi bi-grid-fill me-1"></i></span> All Products
            </a>
            <a
              *ngFor="let cat of categories()"
              [routerLink]="['/categories', cat.name]"
              class="cat-link"
            >
              {{ cat.name }}
            </a>
            <a routerLink="/track-delivery" class="cat-link accent-link">
              <i class="bi bi-geo-alt-fill me-1"></i> Live Tracking
            </a>
          </div>

          <!-- Right Arrow -->
          <button
            class="nav-cat-arrow nav-cat-arrow-next"
            [class.visible]="canScrollNavRight()"
            (click)="scrollNavCategories('right')"
            aria-label="Next categories"
          >
            ›
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header-main {
      background: #ffffff;
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    .top-bar {
      background: linear-gradient(90deg, #1e1b4b 0%, #312e81 100%);
      color: #e0e7ff;
      font-size: 0.8125rem;
      padding: 0.4rem 0;
    }
    .top-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .top-link {
      color: #c7d2fe;
      font-weight: 500;
    }
    .top-link:hover { color: #ffffff; }
    .divider { margin: 0 0.5rem; opacity: 0.4; }

    .nav-container {
      padding: 0.75rem 0;
      background: #ffffff;
    }
    .nav-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      flex-shrink: 0;
    }

    /* Search Bar */
    .search-form-wrap {
      flex: 1;
      max-width: 650px;
    }
    .search-form {
      display: flex;
      border: 2px solid var(--primary-600);
      border-radius: var(--radius-full);
      overflow: hidden;
      background: #ffffff;
      box-shadow: var(--shadow-sm);
      transition: box-shadow var(--transition-fast);
    }
    .search-form:focus-within {
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
    }
    .search-category-select {
      background: #f8fafc;
      border: none;
      border-right: 1px solid var(--border-subtle);
      padding: 0 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      outline: none;
      cursor: pointer;
    }
    .search-input {
      flex: 1;
      border: none;
      padding: 0.65rem 1.15rem;
      font-size: 0.925rem;
      outline: none;
      color: var(--text-primary);
    }
    .search-btn {
      background: linear-gradient(135deg, var(--accent-500) 0%, var(--accent-600) 100%);
      color: #ffffff;
      border: none;
      padding: 0 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background var(--transition-fast);
    }
    .search-btn:hover {
      background: linear-gradient(135deg, var(--accent-400) 0%, var(--accent-500) 100%);
    }

    /* Nav Actions */
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .action-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-primary);
      text-decoration: none;
      cursor: pointer;
    }
    .wallet-chip {
      background: var(--primary-50);
      border: 1px solid var(--primary-200);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-lg);
      transition: all var(--transition-fast);
    }
    .wallet-chip:hover {
      background: var(--primary-100);
      border-color: var(--primary-300);
    }
    .wallet-icon { font-size: 1.25rem; }
    .wallet-info { display: flex; flex-direction: column; line-height: 1.1; }
    .wallet-label { font-size: 0.7rem; color: var(--primary-700); font-weight: 600; text-transform: uppercase; }
    .wallet-amount { font-size: 0.875rem; font-weight: 800; color: var(--primary-900); }

    .notif-bell-btn {
      position: relative;
      padding: 0.5rem;
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }
    .notif-bell-btn:hover { background: var(--bg-subtle); color: var(--primary-600); }
    .notif-icon-wrapper { position: relative; display: flex; align-items: center; }
    .notif-badge-pill {
      position: absolute;
      top: -8px;
      right: -10px;
      background: var(--danger-solid);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: var(--shadow-sm);
    }

    .cart-btn {
      position: relative;
      padding: 0.5rem;
      border-radius: var(--radius-md);
    }
    .cart-btn:hover { background: var(--bg-subtle); color: var(--primary-600); }
    .cart-icon-wrapper { position: relative; display: flex; align-items: center; }
    .cart-badge {
      position: absolute;
      top: -8px;
      right: -10px;
      background: var(--accent-500);
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 800;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
    }

    /* Profile Dropdown */
    .profile-dropdown-wrapper { position: relative; }
    .profile-trigger {
      background: none;
      border: 1px solid var(--border-subtle);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-full);
    }
    .profile-trigger:hover { background: var(--bg-subtle); }
    .avatar-circle {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
      color: #fff;
      font-weight: 800;
      font-size: 0.95rem;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-meta { display: flex; flex-direction: column; text-align: left; line-height: 1.2; }
    .user-name { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
    .user-role-badge { font-size: 0.65rem; padding: 0.1rem 0.4rem; }
    .dropdown-caret { font-size: 0.65rem; color: var(--text-muted); }

    .user-menu-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      width: 240px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      z-index: 1000;
    }
    .user-menu-header {
      padding: 1rem;
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
    }
    .user-menu-header strong { font-size: 0.9rem; color: var(--text-primary); }
    .user-menu-header small { font-size: 0.75rem; color: var(--text-muted); word-break: break-all; }
    .user-menu-links { padding: 0.5rem 0; }
    .menu-link {
      display: block;
      padding: 0.6rem 1rem;
      font-size: 0.875rem;
      color: var(--text-primary);
      font-weight: 500;
    }
    .menu-link:hover { background: var(--primary-50); color: var(--primary-700); }
    .user-menu-footer {
      padding: 0.5rem;
      border-top: 1px solid var(--border-subtle);
      background: #fafafa;
    }
    .logout-btn {
      width: 100%;
      padding: 0.5rem;
      background: none;
      border: none;
      color: var(--danger-solid);
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      text-align: left;
      border-radius: var(--radius-sm);
    }
    .logout-btn:hover { background: var(--danger-bg); }

    .guest-auth-buttons { display: flex; align-items: center; gap: 0.5rem; }

    /* Categories Sub-bar Carousel */
    .categories-bar {
      background: #f8fafc;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      padding: 0.35rem 0;
      font-size: 0.875rem;
      position: relative;
    }
    .nav-cat-carousel-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    .cat-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      overflow-x: auto;
      scroll-behavior: smooth;
      white-space: nowrap;
      width: 100%;
      padding: 0.15rem 1.75rem;
    }
    .nav-cat-arrow {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
      color: #334155;
      cursor: pointer;
      z-index: 5;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      user-select: none;
    }
    .nav-cat-arrow.visible {
      opacity: 1;
      pointer-events: auto;
    }
    .nav-cat-arrow:hover {
      background: #2874f0;
      color: #ffffff;
      border-color: #2874f0;
      box-shadow: 0 4px 10px rgba(40, 116, 240, 0.3);
    }
    .nav-cat-arrow-prev { left: -6px; }
    .nav-cat-arrow-next { right: -6px; }

    .cat-link {
      color: var(--text-secondary);
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .cat-link:hover { color: var(--primary-600); background: #ffffff; }
    .all-products { font-weight: 700; color: var(--primary-700); }
    .accent-link { color: var(--accent-600); font-weight: 600; margin-left: auto; }

    .mobile-toggle { display: none; }

    @media (max-width: 900px) {
      .d-none-mobile { display: none !important; }
      .search-form-wrap { max-width: 100%; }
      .search-category-select { display: none; }
    }
  `]
})
export class NavbarComponent implements OnInit, AfterViewInit {
  @ViewChild('navCatContent') navCatContent!: ElementRef<HTMLDivElement>;

  searchQuery: string = '';
  selectedCategory: string = '';
  categories = signal<CategoryDto[]>([]);
  isUserMenuOpen = signal<boolean>(false);
  currentUrl = signal<string>('/');

  canScrollNavLeft = signal<boolean>(false);
  canScrollNavRight = signal<boolean>(true);

  isHomePage = computed(() => {
    const url = this.currentUrl();
    return url === '/' || url === '' || url.startsWith('/?');
  });

  constructor(
    public authService: AuthService,
    public cartService: CartService,
    public walletService: WalletService,
    public notificationService: NotificationService,
    private productService: ProductService,
    private recommendationService: RecommendationService,
    private router: Router
  ) {
    this.currentUrl.set(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl.set(event.urlAfterRedirects || event.url);
      setTimeout(() => this.onNavCatScroll(), 150);
    });
  }

  ngOnInit(): void {
    this.productService.getAllCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats);
        setTimeout(() => this.onNavCatScroll(), 200);
      },
      error: () => {}
    });

    if (this.authService.isAuthenticated()) {
      this.notificationService.getMyNotifications(0, 10).subscribe({ error: () => {} });
      if (this.authService.isCustomer()) {
        this.walletService.getWallet().subscribe({ error: () => {} });
        this.cartService.loadCart().subscribe({ error: () => {} });
      }
    }
  }

  onSearch(): void {
    if (!this.searchQuery && !this.selectedCategory) return;

    if (this.searchQuery) {
      this.recommendationService.recordSearchActivity(this.searchQuery).subscribe({ error: () => {} });
    }

    if (this.selectedCategory) {
      this.router.navigate(['/categories', this.selectedCategory], {
        queryParams: this.searchQuery ? { query: this.searchQuery } : {}
      });
    } else {
      this.router.navigate(['/products'], {
        queryParams: { search: this.searchQuery }
      });
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update(v => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.closeUserMenu();
    this.cartService.resetLocalState();
    this.authService.logout(true);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.onNavCatScroll(), 200);
  }

  onNavCatScroll(): void {
    if (!this.navCatContent) return;
    const el = this.navCatContent.nativeElement;
    this.canScrollNavLeft.set(el.scrollLeft > 10);
    this.canScrollNavRight.set(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }

  scrollNavCategories(direction: 'left' | 'right'): void {
    if (!this.navCatContent) return;
    const el = this.navCatContent.nativeElement;
    const scrollAmount = Math.max(220, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
    setTimeout(() => this.onNavCatScroll(), 350);
  }

  toggleMobileMenu(): void {
    // mobile drawer toggle
  }

  getRoleBadgeClass(): string {
    const role = this.authService.userRole();
    switch (role) {
      case 'ADMIN': return 'danger';
      case 'MERCHANT': return 'primary';
      case 'DELIVERY_AGENT': return 'info';
      default: return 'accent';
    }
  }
}
