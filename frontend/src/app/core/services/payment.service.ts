import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentDto,
  PaymentInitiateRequest,
  CodCollectRequest,
  RefundDto,
  RefundRequest
} from '../models/payment.models';
import { Page } from '../models/api-response.models';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/payments`;

  constructor(private http: HttpClient) {}

  createPayment(request: PaymentInitiateRequest): Observable<PaymentDto> {
    return this.http.post<PaymentDto>(this.baseUrl, request);
  }

  getPaymentById(paymentId: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.baseUrl}/${paymentId}`);
  }

  getPaymentByOrderId(orderId: number): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.baseUrl}/order/${orderId}`);
  }

  getMyPayments(page: number = 0, size: number = 10): Observable<Page<PaymentDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<Page<PaymentDto>>(`${this.baseUrl}/my-payments`, { params });
  }

  collectCodPayment(paymentId: number, collectedAmount: number): Observable<PaymentDto> {
    const idempotencyKey = 'COD-' + paymentId + '-' + Date.now();
    const request: CodCollectRequest = { collectedAmount, idempotencyKey };
    return this.http.post<PaymentDto>(`${this.baseUrl}/${paymentId}/cod/collect`, request);
  }

  refundPayment(paymentId: number, reason: string, amount: number): Observable<RefundDto> {
    const request: RefundRequest = { reason, amount };
    return this.http.post<RefundDto>(`${this.baseUrl}/${paymentId}/refund`, request);
  }
}
