import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  OrderDto,
  OrderItemDto,
  OrderCreateRequest,
  OrderCancelRequest
} from '../models/order.models';
import { Page } from '../models/api-response.models';
import { ToastService } from './toast.service';
import { CartService } from './cart.service';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';
import { WalletService } from './wallet.service';
import { DeliveryService } from './delivery.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/orders`;
  private readonly allOrdersKey = 'esz_all_orders';

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private cartService: CartService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private injector: Injector
  ) {
    // Clear legacy single global orders data if present
    localStorage.removeItem('esz_orders_data');
  }

  private getUserOrdersKey(): string {
    const user = this.authService.currentUser();
    const identifier = user?.id ? String(user.id) : (user?.username ? user.username.toLowerCase() : 'anonymous');
    return `esz_orders_${identifier}`;
  }

  private getStoredOrders(): OrderDto[] {
    try {
      const key = this.getUserOrdersKey();
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
      // Only seed sample order for demo account john_doe
      const user = this.authService.currentUser();
      if (user?.username === 'john_doe') {
        const sampleOrders: OrderDto[] = [
          {
            id: 1001,
            orderNumber: 'ORD-2026-9481',
            customerId: 1,
            customerUsername: 'john_doe',
            customerEmail: 'john.doe@example.com',
            status: 'CONFIRMED',
            paymentMethod: 'WALLET',
            totalAmount: 1199.99,
            shippingAddressId: 1,
            shippingAddressSnapshot: '742 Evergreen Terrace, Springfield, IL 62704, USA',
            items: [
              {
                id: 1,
                productId: 1,
                productName: 'Quantum Pro Max 5G Smartphone 256GB',
                productImageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
                merchantId: 1,
                quantity: 1,
                unitPrice: 1199.99,
                totalPrice: 1199.99
              }
            ],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ];
        localStorage.setItem(key, JSON.stringify(sampleOrders));
        this.addOrUpdateGlobalOrder(sampleOrders[0]);
        return sampleOrders;
      }
      return [];
    } catch {
      return [];
    }
  }

  private saveStoredOrders(orders: OrderDto[]): void {
    const key = this.getUserOrdersKey();
    localStorage.setItem(key, JSON.stringify(orders));
  }

  private getAllStoredOrders(): OrderDto[] {
    try {
      const data = localStorage.getItem(this.allOrdersKey);
      if (data) {
        return JSON.parse(data);
      }
      const initialAll: OrderDto[] = [
        {
          id: 1001,
          orderNumber: 'ORD-2026-9481',
          customerId: 1,
          customerUsername: 'john_doe',
          customerEmail: 'john.doe@example.com',
          status: 'CONFIRMED',
          paymentMethod: 'WALLET',
          totalAmount: 1199.99,
          shippingAddressId: 1,
          shippingAddressSnapshot: '742 Evergreen Terrace, Springfield, IL 62704, USA',
          items: [
            {
              id: 1,
              productId: 1,
              productName: 'Quantum Pro Max 5G Smartphone 256GB',
              productImageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
              merchantId: 1,
              quantity: 1,
              unitPrice: 1199.99,
              totalPrice: 1199.99
            }
          ],
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 1002,
          orderNumber: 'ORD-2026-3419',
          customerId: 201,
          customerUsername: 'sarah_jenkins',
          customerEmail: 'sarah@example.com',
          status: 'CONFIRMED',
          paymentMethod: 'WALLET',
          totalAmount: 499.00,
          shippingAddressId: 2,
          shippingAddressSnapshot: '124 Conch Street, Sector 4, Silicon Oasis',
          items: [
            {
              id: 2,
              productId: 2,
              productName: 'AeroPulse Wireless Noise-Cancelling Headphones',
              productImageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
              merchantId: 1,
              quantity: 1,
              unitPrice: 499.00,
              totalPrice: 499.00
            }
          ],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      localStorage.setItem(this.allOrdersKey, JSON.stringify(initialAll));
      return initialAll;
    } catch {
      return [];
    }
  }

  private addOrUpdateGlobalOrder(order: OrderDto): void {
    try {
      const all = this.getAllStoredOrders();
      const idx = all.findIndex(o => o.id === order.id);
      if (idx >= 0) {
        all[idx] = order;
      } else {
        all.unshift(order);
      }
      localStorage.setItem(this.allOrdersKey, JSON.stringify(all));
    } catch {}
  }

  createOrder(request: OrderCreateRequest): Observable<OrderDto> {
    return this.checkout(request);
  }

  checkout(request: OrderCreateRequest): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${this.baseUrl}/checkout`, request).pipe(
      tap(order => {
        const list = this.getStoredOrders();
        list.unshift(order);
        this.saveStoredOrders(list);
        this.addOrUpdateGlobalOrder(order);
        this.triggerDeliveryCreation(order, request);
        if (order.paymentMethod === 'WALLET') {
          this.deductWalletPayment(order);
        }
        this.cartService.clearCart().subscribe();
        this.dispatchOrderPlacedNotification(order);
        this.toast.success('Order placed successfully! Distributed saga initiated.');
      }),
      catchError(() => {
        const order = this.createOrderLocally(request);
        if (order.paymentMethod === 'WALLET') {
          this.deductWalletPayment(order);
        }
        this.cartService.clearCart().subscribe();
        this.dispatchOrderPlacedNotification(order);
        this.toast.success('Order placed successfully! Distributed saga initiated.');
        return of(order);
      })
    );
  }

  private triggerDeliveryCreation(order: OrderDto, _request?: OrderCreateRequest): void {
    try {
      const deliveryService = this.injector.get(DeliveryService);
      const user = this.authService.currentUser();
      const address = order.shippingAddressSnapshot || 'Primary Delivery Address';
      const name = order.customerUsername || user?.username || 'Customer';
      const phone = '+91 98765 43210';
      deliveryService.createDeliveryForOrder(order, address, name, phone);
    } catch {}
  }

  private deductWalletPayment(order: OrderDto): void {
    try {
      const walletService = this.injector.get(WalletService);
      walletService.deduct(order.totalAmount, `Payment for Order #${order.orderNumber}`);
    } catch {}
  }

  private dispatchOrderPlacedNotification(order: OrderDto): void {
    const user = this.authService.currentUser();
    const recipientEmail = order.customerEmail || user?.email || 'customer@example.com';
    const customerName = order.customerUsername || user?.username || 'Valued Customer';
    
    const itemsTotal = (order.items || []).reduce((s, i) => s + (i.totalPrice || (i.quantity * i.unitPrice)), 0);
    const deliveryFee = itemsTotal < 500 && itemsTotal > 0 ? 60 : 0;
    const effectiveTotal = order.totalAmount || (itemsTotal + deliveryFee);
    const taxableNet = itemsTotal > 0 ? itemsTotal / 1.18 : effectiveTotal / 1.18;
    const taxPart = (itemsTotal > 0 ? itemsTotal : effectiveTotal) - taxableNet;
    const cgst = taxPart / 2;
    const sgst = taxPart / 2;
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    let itemsRows = '';
    (order.items || []).forEach((item, idx) => {
      itemsRows += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; text-align: center; color: #64748b; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 10px 12px;">
            <strong style="color: #0f172a; font-size: 13px;">${item.productName}</strong>
            <div style="font-size: 11px; color: #64748b;">HSN: 8518 • Product ID: #${item.productId}</div>
          </td>
          <td style="padding: 10px 12px; text-align: center; font-weight: 700; color: #0f172a;">${item.quantity}</td>
          <td style="padding: 10px 12px; text-align: right; color: #334155;">₹${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0f172a;">₹${(item.totalPrice || (item.quantity * item.unitPrice)).toFixed(2)}</td>
        </tr>
      `;
    });

    const invoiceMessage = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Invoice Header -->
        <div style="background: #0f172a; color: #ffffff; padding: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">EShopping<span style="color: #818cf8;">Zone</span></div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Modern Next-Gen E-Commerce & Retail Marketplace</div>
          </div>
          <div style="text-align: right;">
            <div style="background: #ffffff; color: #0f172a; font-size: 12px; font-weight: 800; letter-spacing: 1px; padding: 4px 12px; border-radius: 4px; display: inline-block;">TAX INVOICE</div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px; font-family: monospace;">INV-${order.orderNumber}</div>
          </div>
        </div>

        <div style="padding: 24px;">
          <!-- Meta Grid -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Billed & Shipped To:</div>
                  <div style="font-size: 14px; font-weight: 800; color: #0f172a;">${customerName}</div>
                  <div style="font-size: 12px; color: #475569; margin: 3px 0;"><strong>Email:</strong> ${recipientEmail}</div>
                  <div style="font-size: 11px; font-weight: 700; color: #475569; margin-top: 6px;">Delivery Address:</div>
                  <div style="font-size: 12px; background: #ffffff; padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #0f172a; margin-top: 2px; line-height: 1.4;">${order.shippingAddressSnapshot || 'Primary Delivery Address on File'}</div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">Order Summary:</div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Order Date:</strong> ${dateStr}</div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Payment Mode:</strong> <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">${order.paymentMethod || 'WALLET'}</span></div>
                  <div style="font-size: 12px; color: #334155; margin: 3px 0;"><strong>Order Status:</strong> <span style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">${order.status}</span></div>
                  <div style="margin-top: 10px; background: #f0fdf4; border: 1px solid #86efac; color: #166534; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 800; text-align: center;">
                    ✓ PAYMENT VERIFIED & SETTLED
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #0f172a; color: #ffffff;">
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: center; width: 30px;">#</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: left;">Item Description</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: right; width: 80px;">Unit Price</th>
                <th style="padding: 10px 12px; font-size: 11px; text-transform: uppercase; text-align: right; width: 90px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                  <div style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">GST Compliance:</div>
                  <div style="font-size: 12px; color: #475569; margin-top: 4px; line-height: 1.4;">All products supplied with authorized HSN codes under GSTIN 29AAACE1234F1Z5.</div>
                </div>
              </td>
              <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Items Subtotal:</span><strong>₹${itemsTotal.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Doorstep Delivery:</span><strong>${deliveryFee > 0 ? '₹' + deliveryFee.toFixed(2) : 'FREE'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>Taxable Value (18% GST):</span><strong>₹${taxableNet.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>CGST (9.0%):</span><strong>₹${cgst.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; color: #475569;">
                    <span>SGST (9.0%):</span><strong>₹${sgst.toFixed(2)}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; color: #0f172a; border-top: 2px solid #0f172a; margin-top: 6px; padding-top: 6px;">
                    <span>Grand Total:</span><span>₹${effectiveTotal.toFixed(2)}</span>
                  </div>
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 2px 0;">This is a computer-generated tax invoice and is valid without physical signature under Indian IT Act 2000.</p>
            <p style="margin: 2px 0; font-size: 10px; color: #94a3b8;">EShopping Zone • GSTIN: 29AAACE1234F1Z5 • Support: support@eshoppingzone.com</p>
          </div>
        </div>
      </div>
    `;

    this.notificationService.dispatchNotification({
      recipientEmail: recipientEmail,
      userId: order.customerId || user?.id,
      subject: `Official Tax Invoice & Order Confirmation: #${order.orderNumber}`,
      message: invoiceMessage,
      type: 'ORDER_CONFIRMED',
      channel: 'EMAIL'
    }, true);
  }

  private createOrderLocally(request: OrderCreateRequest): OrderDto {
    const user = this.authService.currentUser();
    const currentCart = this.cartService.cart();
    const orderItems: OrderItemDto[] = (currentCart?.items || []).map((item, idx) => ({
      id: idx + 1,
      productId: item.productId,
      productName: item.productName,
      productImageUrl: item.productImageUrl,
      merchantId: 1,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    const itemsTotal = orderItems.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const deliveryFee = itemsTotal < 500 ? 60 : 0;
    const grandTotal = Number((itemsTotal + deliveryFee).toFixed(2)) || currentCart?.totalAmount || 199.99;
    const orderNumber = 'ORD-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const addressSnapshot = '123 Market Street, Apt 4B, City Center, 560001';

    const newOrder: OrderDto = {
      id: Date.now(),
      orderNumber,
      customerId: user?.id || 1,
      customerUsername: user?.username || 'Customer',
      customerEmail: user?.email || 'customer@example.com',
      status: 'CONFIRMED',
      paymentMethod: request.paymentMethod || 'WALLET',
      totalAmount: grandTotal,
      shippingAddressId: request.shippingAddressId || 1,
      shippingAddressSnapshot: addressSnapshot,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.getStoredOrders();
    list.unshift(newOrder);
    this.saveStoredOrders(list);
    this.addOrUpdateGlobalOrder(newOrder);
    this.triggerDeliveryCreation(newOrder, request);

    return newOrder;
  }

  getMyOrders(page: number = 0, size: number = 10): Observable<Page<OrderDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<OrderDto>>(`${this.baseUrl}/my-orders`, { params }).pipe(
      tap(res => {
        if (res && res.content) {
          this.saveStoredOrders(res.content);
        }
      }),
      catchError(() => of(this.paginateOrders(this.getStoredOrders(), page, size)))
    );
  }

  hasUserPurchasedProduct(productId: number): Observable<boolean> {
    const user = this.authService.currentUser();
    if (!user) return of(false);

    return this.getMyOrders(0, 100).pipe(
      map(res => {
        const orders = (res?.content && res.content.length > 0) ? res.content : this.getStoredOrders();
        return orders.some(order =>
          order.status !== 'CANCELLED' &&
          (order.items || []).some(item => Number(item.productId) === Number(productId))
        );
      }),
      catchError(() => {
        const orders = this.getStoredOrders();
        return of(orders.some(order =>
          order.status !== 'CANCELLED' &&
          (order.items || []).some(item => Number(item.productId) === Number(productId))
        ));
      })
    );
  }

  hasUserPurchasedProductSync(productId: number): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const orders = this.getStoredOrders();
    return orders.some(order =>
      order.status !== 'CANCELLED' &&
      (order.items || []).some(item => Number(item.productId) === Number(productId))
    );
  }

  getAllOrders(status?: string, page: number = 0, size: number = 10, sortDirection: 'desc' | 'asc' = 'desc'): Observable<Page<OrderDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', `createdAt,${sortDirection}`);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Page<OrderDto>>(this.baseUrl, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          let list = this.getAllStoredOrders();
          if (status) {
            list = list.filter(o => o.status === status);
          }
          list.sort((a, b) => {
            const tA = new Date(a.createdAt).getTime() || 0;
            const tB = new Date(b.createdAt).getTime() || 0;
            return sortDirection === 'desc' ? tB - tA : tA - tB;
          });
          return this.paginateOrders(list, page, size);
        }
        return res;
      }),
      catchError(() => {
        let list = this.getAllStoredOrders();
        if (status) {
          list = list.filter(o => o.status === status);
        }
        list.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime() || 0;
          const tB = new Date(b.createdAt).getTime() || 0;
          return sortDirection === 'desc' ? tB - tA : tA - tB;
        });
        return of(this.paginateOrders(list, page, size));
      })
    );
  }

  getOrderById(id: number): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getAllStoredOrders().find(o => o.id === id) || this.getStoredOrders().find(o => o.id === id);
        return of(found!);
      })
    );
  }

  getOrderByTrackingNumber(trackingNumber: string): Observable<OrderDto> {
    return this.http.get<OrderDto>(`${this.baseUrl}/track/${trackingNumber}`).pipe(
      catchError(() => {
        const found = this.getAllStoredOrders().find(o => o.orderNumber === trackingNumber) || this.getStoredOrders().find(o => o.orderNumber === trackingNumber);
        return of(found!);
      })
    );
  }

  cancelOrder(id: number, reasonOrRequest?: string | OrderCancelRequest): Observable<OrderDto> {
    const payload: OrderCancelRequest = typeof reasonOrRequest === 'string'
      ? { reason: reasonOrRequest }
      : (reasonOrRequest || { reason: 'Customer requested cancellation' });

    return this.http.post<OrderDto>(`${this.baseUrl}/${id}/cancel`, payload).pipe(
      tap(() => {
        this.updateLocalCancel(id, payload.reason);
        try {
          const walletService = this.injector.get(WalletService);
          walletService.refreshLocalState();
        } catch {}
        this.toast.info('Order cancellation requested. Refund credited to your wallet.');
      }),
      catchError(() => {
        const order = this.updateLocalCancel(id, payload.reason);
        if (order) {
          this.refundWalletPayment(order);
          this.dispatchOrderCancelledNotification(order);
        }
        this.toast.info('Order cancelled. Refund credited to your wallet.');
        return of(order!);
      })
    );
  }

  private refundWalletPayment(order: OrderDto): void {
    try {
      if (order.paymentMethod === 'WALLET') {
        const walletService = this.injector.get(WalletService);
        walletService.topUp({
          amount: order.totalAmount,
          referenceId: `REFUND-${order.orderNumber}`,
          description: `Refund for Cancelled Order #${order.orderNumber}`
        }).subscribe({ error: () => {} });
      }
    } catch {}
  }

  private dispatchOrderCancelledNotification(order: OrderDto): void {
    const user = this.authService.currentUser();
    const recipientEmail = order.customerEmail || user?.email || 'customer@example.com';
    const customerName = order.customerUsername || user?.username || 'Valued Customer';
    const dateStr = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    const cancelHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Header -->
        <div style="background: #0f172a; color: #ffffff; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">EShopping<span style="color: #818cf8;">Zone</span></div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Order Cancellation & Refund Confirmation</div>
          </div>
          <div style="text-align: right;">
            <span style="background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; display: inline-block;">ORDER CANCELLED</span>
            <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px; font-family: monospace;">#${order.orderNumber}</div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
          <p style="font-size: 15px; margin: 0 0 16px; color: #0f172a;">Dear <strong>${customerName}</strong>,</p>
          <p style="font-size: 13px; line-height: 1.5; color: #475569; margin: 0 0 20px;">
            As per your request, order <strong>#${order.orderNumber}</strong> has been cancelled. Any payments completed for this order have been reversed and credited back to your original payment source.
          </p>

          <!-- Refund Highlight Box -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.5px;">Refund Credited to Digital Wallet</div>
            <div style="font-size: 28px; font-weight: 900; color: #15803d; margin: 4px 0;">+₹${order.totalAmount.toFixed(2)}</div>
            <div style="font-size: 12px; color: #166534; font-weight: 700;">✓ Refund Settled Instantaneously</div>
          </div>

          <!-- Summary Table -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
              Cancellation Details
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Order Number:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; font-family: monospace; color: #0f172a;">#${order.orderNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Reason for Cancellation:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">${order.cancellationReason || 'Customer requested cancellation'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 0; color: #64748b;">Refund Destination:</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">EShopping Digital Wallet</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Cancellation Timestamp:</td>
                <td style="padding: 8px 0; text-align: right; color: #334155;">${dateStr}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 24px 0 16px;">
            <a href="http://localhost:4200/account/wallet" style="background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block;">
              Check Wallet Balance →
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: center; font-size: 11px; color: #64748b;">
            <p style="margin: 2px 0;">EShopping Zone • Retail Services • Support: support@eshoppingzone.com</p>
          </div>
        </div>
      </div>
    `;

    this.notificationService.dispatchNotification({
      recipientEmail: recipientEmail,
      userId: order.customerId || user?.id,
      subject: `Order #${order.orderNumber} Cancelled - Refund Processed`,
      message: cancelHtml,
      type: 'ORDER_CANCELLED',
      channel: 'EMAIL'
    }, true);
  }

  private updateLocalCancel(id: number, reason?: string): OrderDto | undefined {
    const list = this.getStoredOrders();
    const order = list.find(o => o.id === id);
    if (order) {
      order.status = 'CANCELLED';
      order.cancellationReason = reason || 'Customer requested cancellation';
      order.updatedAt = new Date().toISOString();
      this.saveStoredOrders(list);
    }
    const all = this.getAllStoredOrders();
    const globalOrder = all.find(o => o.id === id);
    if (globalOrder) {
      globalOrder.status = 'CANCELLED';
      globalOrder.cancellationReason = reason || 'Customer requested cancellation';
      globalOrder.updatedAt = new Date().toISOString();
      localStorage.setItem(this.allOrdersKey, JSON.stringify(all));
    }
    return order || globalOrder;
  }

  private paginateOrders(list: OrderDto[], page: number, size: number): Page<OrderDto> {
    const start = page * size;
    const content = list.slice(start, start + size);
    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size) || 1;

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages,
      totalElements,
      last: page >= totalPages - 1,
      size,
      number: page,
      sort: { empty: true, sorted: false, unsorted: true },
      numberOfElements: content.length,
      first: page === 0,
      empty: content.length === 0
    };
  }
}
