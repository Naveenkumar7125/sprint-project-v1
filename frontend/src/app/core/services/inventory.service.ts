import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { InventoryDto, StockUpdateRequest } from '../models/inventory.models';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/inventory`;

  constructor(private http: HttpClient) {}

  getInventory(productId: number): Observable<InventoryDto> {
    return this.http.get<InventoryDto>(`${this.baseUrl}/${productId}`);
  }

  updateStock(productId: number, quantity: number): Observable<InventoryDto> {
    const request: StockUpdateRequest = { productId, availableStock: quantity, quantity };
    return this.http.post<InventoryDto>(`${this.baseUrl}/stock-update`, request);
  }
}
