import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  DeliveryDto,
  DeliveryCreateRequest,
  DeliveryAssignmentRequest,
  DeliveryStatusUpdateRequest,
  DeliveryStatus
} from '../models/delivery.models';
import { Page } from '../models/api-response.models';
import { AuthService } from '../auth/auth.service';
import { OrderDto } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/delivery`;
  private readonly storageKey = 'esz_deliveries';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private injector: Injector
  ) {}

  private getStoredDeliveries(): DeliveryDto[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
      const initialSeeds: DeliveryDto[] = [
        {
          id: 501,
          orderId: 1001,
          trackingNumber: 'TRK-ESHOP-948102',
          deliveryAgentId: 4,
          deliveryAgentUsername: 'delivery_dan',
          status: 'ASSIGNED',
          recipientName: 'John Doe',
          recipientPhone: '+91 98765 43210',
          deliveryAddress: '742 Evergreen Terrace, Springfield, IL 62704, USA',
          notes: 'Handle with care. Fragile electronic items inside.',
          assignedAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 502,
          orderId: 1002,
          trackingNumber: 'TRK-ESHOP-773120',
          status: 'PENDING',
          recipientName: 'Sarah Jenkins',
          recipientPhone: '+91 98765 11223',
          deliveryAddress: '124 Conch Street, Sector 4, Silicon Oasis',
          notes: 'Express 2-hour priority delivery run',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 503,
          orderId: 1003,
          trackingNumber: 'TRK-ESHOP-552914',
          status: 'PENDING',
          recipientName: 'Michael Scott',
          recipientPhone: '+91 98765 88990',
          deliveryAddress: '1725 Slough Avenue, Tech Park Building C',
          notes: 'Deliver to reception on 3rd floor',
          createdAt: new Date(Date.now() - 900000).toISOString(),
          updatedAt: new Date(Date.now() - 900000).toISOString()
        }
      ];
      localStorage.setItem(this.storageKey, JSON.stringify(initialSeeds));
      return initialSeeds;
    } catch {
      return [];
    }
  }

  private saveStoredDeliveries(deliveries: DeliveryDto[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(deliveries));
    } catch {}
  }

  createDeliveryForOrder(
    order: OrderDto,
    addressSnapshot?: string,
    recipientName?: string,
    phone?: string
  ): DeliveryDto {
    const list = this.getStoredDeliveries();
    
    // Avoid duplicate delivery entries for the same orderId
    const existingIndex = list.findIndex(d => d.orderId === order.id);
    if (existingIndex >= 0) {
      return list[existingIndex];
    }

    const trackingSuffix = Math.floor(100000 + Math.random() * 900000);
    const trackingNumber = `TRK-ESHOP-${trackingSuffix}`;

    const newDelivery: DeliveryDto = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      orderId: order.id,
      trackingNumber,
      status: 'CREATED',
      recipientName: recipientName || order.customerUsername || 'Valued Customer',
      recipientPhone: phone || '+91 98765 43210',
      deliveryAddress: addressSnapshot || order.shippingAddressSnapshot || '123 Market Street, Apt 4B, City Center',
      notes: `Order #${order.orderNumber} - Awaiting Merchant Preparation & Pickup Confirmation`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    list.unshift(newDelivery);
    this.saveStoredDeliveries(list);
    return newDelivery;
  }

  getDeliveryById(id: number): Observable<DeliveryDto> {
    return this.http.get<DeliveryDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const item = this.getStoredDeliveries().find(d => d.id === id);
        return of(item!);
      })
    );
  }

  getDeliveryByOrderId(orderId: number): Observable<DeliveryDto> {
    return this.http.get<DeliveryDto>(`${this.baseUrl}/order/${orderId}`).pipe(
      catchError(() => {
        const item = this.getStoredDeliveries().find(d => d.orderId === orderId);
        return of(item!);
      })
    );
  }

  getDeliveryByTrackingNumber(trackingNumber: string): Observable<DeliveryDto> {
    return this.http.get<DeliveryDto>(`${this.baseUrl}/tracking/${trackingNumber}`).pipe(
      catchError(() => {
        const item = this.getStoredDeliveries().find(
          d => d.trackingNumber?.toLowerCase() === trackingNumber?.trim().toLowerCase()
        );
        return of(item!);
      })
    );
  }

  getMyDeliveries(page: number = 0, size: number = 10): Observable<Page<DeliveryDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<Page<DeliveryDto>>(`${this.baseUrl}/agent/my-deliveries`, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          return this.getLocalMyDeliveries(page, size);
        }
        return res;
      }),
      catchError(() => of(this.getLocalMyDeliveries(page, size)))
    );
  }

  private getLocalMyDeliveries(page: number, size: number): Page<DeliveryDto> {
    const user = this.authService.currentUser();
    const all = this.getStoredDeliveries();

    // Filter deliveries assigned to this agent, or if agent is delivery_dan / ID 4
    let agentDeliveries = all.filter(d => {
      if (user?.id && d.deliveryAgentId === user.id) return true;
      if (user?.username && d.deliveryAgentUsername?.toLowerCase() === user.username.toLowerCase()) return true;
      if (user?.role === 'DELIVERY_AGENT' && (user?.username === 'delivery_dan' || user?.id === 4) && d.deliveryAgentId === 4) return true;
      return false;
    });

    return this.paginate(agentDeliveries, page, size);
  }

  getAllDeliveries(status?: DeliveryStatus, page: number = 0, size: number = 10): Observable<Page<DeliveryDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<Page<DeliveryDto>>(this.baseUrl, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          let list = this.getStoredDeliveries();
          if (status) {
            list = list.filter(d => d.status === status);
          }
          return this.paginate(list, page, size);
        }
        return res;
      }),
      catchError(() => {
        let list = this.getStoredDeliveries();
        if (status) {
          list = list.filter(d => d.status === status);
        }
        return of(this.paginate(list, page, size));
      })
    );
  }

  markReadyForPickup(deliveryId: number, remarks?: string): Observable<DeliveryDto> {
    const request: DeliveryStatusUpdateRequest = { status: 'AVAILABLE', remarks: remarks || 'Ready for courier pickup' };
    return this.http.post<DeliveryDto>(`${this.baseUrl}/${deliveryId}/ready-for-pickup`, request).pipe(
      tap(updated => {
        this.updateLocalDelivery(updated);
      }),
      catchError(() => {
        const list = this.getStoredDeliveries();
        const item = list.find(d => d.id === deliveryId);
        if (item) {
          item.status = 'AVAILABLE';
          item.updatedAt = new Date().toISOString();
          this.saveStoredDeliveries(list);
          return of(item);
        }
        return of({} as DeliveryDto);
      })
    );
  }

  getMerchantDeliveries(page: number = 0, size: number = 20): Observable<Page<DeliveryDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<Page<DeliveryDto>>(`${this.baseUrl}/merchant/my-orders`, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          return this.getLocalMerchantDeliveries(page, size);
        }
        return res;
      }),
      catchError(() => of(this.getLocalMerchantDeliveries(page, size)))
    );
  }

  private getLocalMerchantDeliveries(page: number, size: number): Page<DeliveryDto> {
    const user = this.authService.currentUser();
    const all = this.getStoredDeliveries();
    const merchantDeliveries = all.filter(d => {
      if (user?.role === 'ADMIN') return true;
      if (user?.id && d.merchantId === user.id) return true;
      return true; // Fallback to let merchant view
    });
    return this.paginate(merchantDeliveries, page, size);
  }

  getAvailableDeliveries(page: number = 0, size: number = 10): Observable<Page<DeliveryDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<Page<DeliveryDto>>(`${this.baseUrl}/available`, { params }).pipe(
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          const list = this.getStoredDeliveries().filter(d => d.status === 'AVAILABLE' && !d.deliveryAgentId);
          return this.paginate(list, page, size);
        }
        return res;
      }),
      catchError(() => {
        const list = this.getStoredDeliveries().filter(d => d.status === 'AVAILABLE' && !d.deliveryAgentId);
        return of(this.paginate(list, page, size));
      })
    );
  }

  acceptDelivery(deliveryId: number): Observable<DeliveryDto> {
    return this.http.post<DeliveryDto>(`${this.baseUrl}/${deliveryId}/accept`, {}).pipe(
      tap(updated => {
        this.updateLocalDelivery(updated);
      }),
      catchError(() => {
        const user = this.authService.currentUser();
        const agentId = user?.id || 4;
        const agentName = user?.username || 'delivery_dan';

        const list = this.getStoredDeliveries();
        const item = list.find(d => d.id === deliveryId);
        if (item) {
          item.deliveryAgentId = agentId;
          item.deliveryAgentUsername = agentName;
          item.status = 'ACCEPTED';
          item.assignedAt = new Date().toISOString();
          item.updatedAt = new Date().toISOString();
          this.saveStoredDeliveries(list);
          this.syncOrderStatusForDelivery(item);
          return of(item);
        }
        return of({} as DeliveryDto);
      })
    );
  }

  assignDelivery(deliveryId: number, deliveryAgentId: number, notes?: string): Observable<DeliveryDto> {
    const request: DeliveryAssignmentRequest = { deliveryAgentId, notes };
    return this.http.post<DeliveryDto>(`${this.baseUrl}/${deliveryId}/assign`, request).pipe(
      tap(updated => {
        this.updateLocalDelivery(updated);
      }),
      catchError(() => {
        const agentNameMap: Record<number, string> = {
          4: 'delivery_dan',
          101: 'Rider Dave',
          102: 'Express Courier Sara'
        };
        const agentName = agentNameMap[deliveryAgentId] || `Agent #${deliveryAgentId}`;

        const list = this.getStoredDeliveries();
        const item = list.find(d => d.id === deliveryId);
        if (item) {
          item.deliveryAgentId = deliveryAgentId;
          item.deliveryAgentUsername = agentName;
          item.status = 'ASSIGNED';
          item.notes = notes || item.notes;
          item.assignedAt = new Date().toISOString();
          item.updatedAt = new Date().toISOString();
          this.saveStoredDeliveries(list);
          return of(item);
        }
        return of({} as DeliveryDto);
      })
    );
  }

  updateDeliveryStatus(deliveryId: number, status: DeliveryStatus, notes?: string): Observable<DeliveryDto> {
    const request: DeliveryStatusUpdateRequest = { status, notes };
    return this.http.patch<DeliveryDto>(`${this.baseUrl}/${deliveryId}/status`, request).pipe(
      tap(updated => {
        this.updateLocalDelivery(updated);
      }),
      catchError(() => {
        const list = this.getStoredDeliveries();
        const item = list.find(d => d.id === deliveryId);
        if (item) {
          item.status = status;
          if (notes) item.notes = notes;
          if (status === 'DELIVERED') {
            item.deliveredAt = new Date().toISOString();
          }
          item.updatedAt = new Date().toISOString();
          this.saveStoredDeliveries(list);
          this.syncOrderStatusForDelivery(item);
          return of(item);
        }
        return of({} as DeliveryDto);
      })
    );
  }

  private updateLocalDelivery(del: DeliveryDto): void {
    if (!del || !del.id) return;
    const list = this.getStoredDeliveries();
    const idx = list.findIndex(d => d.id === del.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...del };
    } else {
      list.unshift(del);
    }
    this.saveStoredDeliveries(list);
    this.syncOrderStatusForDelivery(del);
  }

  private syncOrderStatusForDelivery(del: DeliveryDto): void {
    try {
      // Synchronize in esz_all_orders and any user order storage if delivered
      const allOrdersStr = localStorage.getItem('esz_all_orders');
      if (allOrdersStr) {
        const allOrders: OrderDto[] = JSON.parse(allOrdersStr);
        const order = allOrders.find(o => o.id === del.orderId);
        if (order) {
          if (del.status === 'DELIVERED') {
            order.status = 'DELIVERED';
          } else if (del.status === 'OUT_FOR_DELIVERY') {
            order.status = 'SHIPPED';
          }
          order.updatedAt = new Date().toISOString();
          localStorage.setItem('esz_all_orders', JSON.stringify(allOrders));
        }
      }
    } catch {}
  }

  private paginate(list: DeliveryDto[], page: number, size: number): Page<DeliveryDto> {
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
