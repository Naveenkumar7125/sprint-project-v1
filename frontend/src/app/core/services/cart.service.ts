import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartDto, CartItemDto, AddToCartRequest, UpdateCartItemRequest } from '../models/cart.models';
import { ToastService } from './toast.service';
import { AuthService } from '../auth/auth.service';
import { ProductService } from './product.service';

const CART_STORAGE_KEY = 'esz_cart_data';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/cart`;

  private cartSignal = signal<CartDto | null>(this.getStoredCart());
  public cart = this.cartSignal.asReadonly();
  public totalItems = computed(() => this.cartSignal()?.totalItems ?? 0);
  public subtotalAmount = computed(() => {
    const items = this.cartSignal()?.items || [];
    if (items.length > 0) {
      return Number(items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2));
    }
    return Number((this.cartSignal()?.totalAmount ?? 0).toFixed(2));
  });
  public readonly freeDeliveryThreshold = 500;
  public readonly deliveryFeeRate = 60;
  public deliveryFee = computed(() => {
    const subtotal = this.subtotalAmount();
    return (subtotal > 0 && subtotal < 500) ? 60 : 0;
  });
  public totalAmount = computed(() => {
    const subtotal = this.subtotalAmount();
    const fee = this.deliveryFee();
    return Number((subtotal + fee).toFixed(2));
  });
  public amountNeededForFreeDelivery = computed(() => {
    const subtotal = this.subtotalAmount();
    return (subtotal > 0 && subtotal < 500) ? Number((500 - subtotal).toFixed(2)) : 0;
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    private toast: ToastService,
    private authService: AuthService,
    private productService: ProductService
  ) {
    this.loadCart().subscribe();
  }

  private getUserCartKey(): string {
    const user = this.authService.currentUser();
    const identifier = user?.id ? String(user.id) : (user?.username ? user.username.toLowerCase() : 'anonymous');
    return `esz_cart_${identifier}`;
  }

  private getStoredCart(): CartDto | null {
    localStorage.removeItem(CART_STORAGE_KEY);
    if (!this.authService?.isAuthenticated() || this.authService?.userRole() !== 'CUSTOMER') {
      return null;
    }
    try {
      const data = localStorage.getItem(this.getUserCartKey());
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private saveStoredCart(cart: CartDto | null): void {
    const key = this.getUserCartKey();
    if (cart && this.authService.isAuthenticated()) {
      localStorage.setItem(key, JSON.stringify(cart));
    } else {
      localStorage.removeItem(key);
    }
    this.cartSignal.set(cart);
  }

  loadCart(): Observable<CartDto | null> {
    if (!this.authService.isAuthenticated() || this.authService.userRole() !== 'CUSTOMER') {
      this.cartSignal.set(null);
      return of(null);
    }

    return this.http.get<CartDto>(this.baseUrl).pipe(
      tap({
        next: (cart) => {
          if (cart) {
            this.saveStoredCart(cart);
          }
        }
      }),
      catchError(() => {
        return of(this.getStoredCart());
      })
    );
  }

  addItem(productId: number, quantity: number = 1, productInfo?: any): Observable<CartDto> {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('Please log in to add items to your cart.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return throwError(() => new Error('Authentication required'));
    }

    if (this.authService.userRole() !== 'CUSTOMER') {
      this.toast.warning('Only customer accounts can add items to the cart.');
      return throwError(() => new Error('Customer role required'));
    }

    const prod = productInfo || this.productService.getProductByIdSync(Number(productId));
    if (prod && prod.active === false) {
      this.toast.error('This product is currently inactive and cannot be purchased.');
      return throwError(() => new Error('Product is inactive'));
    }

    const request: AddToCartRequest = { productId, quantity };
    return this.http.post<CartDto>(`${this.baseUrl}/items`, request).pipe(
      tap(cart => {
        this.saveStoredCart(cart);
        this.toast.success('Item added to cart!');
      }),
      catchError((err) => {
        if (err?.status === 400 || err?.error?.message?.includes('inactive')) {
          this.toast.error(err?.error?.message || 'This product is inactive.');
          return throwError(() => err);
        }
        const cart = this.addItemLocally(productId, quantity, productInfo);
        this.toast.success('Item added to cart!');
        return of(cart);
      })
    );
  }

  private addItemLocally(productId: number, quantity: number, productInfo?: any): CartDto {
    let current = this.getStoredCart() || {
      id: Date.now(),
      customerId: this.authService.currentUser()?.id || 1,
      items: [] as CartItemDto[],
      totalAmount: 0,
      totalItems: 0
    };

    const numProductId = Number(productId);
    const existingIndex = current.items.findIndex(i => Number(i.productId) === numProductId);

    if (existingIndex !== -1) {
      current.items[existingIndex].quantity += quantity;
      current.items[existingIndex].totalPrice = Number(
        (current.items[existingIndex].quantity * current.items[existingIndex].unitPrice).toFixed(2)
      );
    } else {
      const prod = productInfo || this.productService.getProductByIdSync(numProductId);
      const productName = prod?.name || ('Product #' + productId);
      const unitPrice = prod?.price != null ? Number(prod.price) : 49.99;
      const productImageUrl = prod?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

      const newItem: CartItemDto = {
        id: Date.now(),
        productId: numProductId,
        productName,
        productImageUrl,
        unitPrice,
        quantity,
        totalPrice: Number((quantity * unitPrice).toFixed(2))
      };
      current.items.push(newItem);
    }

    current.totalItems = current.items.reduce((sum, item) => sum + item.quantity, 0);
    current.totalAmount = Number(
      current.items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
    );

    this.saveStoredCart(current);
    return current;
  }

  updateQuantity(productId: number, quantity: number): Observable<CartDto> {
    const request: UpdateCartItemRequest = { quantity };
    return this.http.put<CartDto>(`${this.baseUrl}/items/${productId}`, request).pipe(
      tap(cart => {
        this.saveStoredCart(cart);
        this.toast.info('Cart updated.');
      }),
      catchError(() => {
        const cart = this.updateQuantityLocally(productId, quantity);
        this.toast.info('Cart updated.');
        return of(cart);
      })
    );
  }

  private updateQuantityLocally(productId: number, quantity: number): CartDto {
    let current = this.getStoredCart();
    if (!current) return this.addItemLocally(productId, quantity);

    if (quantity <= 0) {
      return this.removeItemLocally(productId);
    }

    const item = current.items.find(i => Number(i.productId) === Number(productId));
    if (item) {
      item.quantity = quantity;
      item.totalPrice = Number((quantity * item.unitPrice).toFixed(2));
    }

    current.totalItems = current.items.reduce((sum, i) => sum + i.quantity, 0);
    current.totalAmount = Number(
      current.items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)
    );

    this.saveStoredCart(current);
    return current;
  }

  removeItem(productId: number): Observable<CartDto> {
    return this.http.delete<CartDto>(`${this.baseUrl}/items/${productId}`).pipe(
      tap(cart => {
        this.saveStoredCart(cart);
        this.toast.info('Item removed from cart.');
      }),
      catchError(() => {
        const cart = this.removeItemLocally(productId);
        this.toast.info('Item removed from cart.');
        return of(cart);
      })
    );
  }

  private removeItemLocally(productId: number): CartDto {
    let current = this.getStoredCart() || {
      id: Date.now(),
      customerId: 1,
      items: [] as CartItemDto[],
      totalAmount: 0,
      totalItems: 0
    };

    current.items = current.items.filter(i => Number(i.productId) !== Number(productId));
    current.totalItems = current.items.reduce((sum, i) => sum + i.quantity, 0);
    current.totalAmount = Number(
      current.items.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)
    );

    this.saveStoredCart(current);
    return current;
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.baseUrl).pipe(
      tap(() => {
        this.saveStoredCart(null);
        this.toast.info('Cart cleared.');
      }),
      catchError(() => {
        this.saveStoredCart(null);
        this.toast.info('Cart cleared.');
        return of(void 0);
      })
    );
  }

  resetLocalState(): void {
    this.saveStoredCart(null);
  }
}
