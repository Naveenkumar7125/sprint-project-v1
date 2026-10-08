import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProductRecommendationDto,
  FrequentlyPurchasedTogetherDto,
  UserCategoryPreferenceDto,
  SearchEventRequest
} from '../models/recommendation.models';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/recommendations`;

  constructor(private http: HttpClient) {}

  getMostSearched(period: string = '7D', limit: number = 8): Observable<ProductRecommendationDto[]> {
    const params = new HttpParams().set('period', period).set('limit', limit.toString());
    return this.http.get<ProductRecommendationDto[]>(`${this.baseUrl}/most-searched`, { params });
  }

  getMostPurchased(period: string = '30D', limit: number = 8): Observable<ProductRecommendationDto[]> {
    const params = new HttpParams().set('period', period).set('limit', limit.toString());
    return this.http.get<ProductRecommendationDto[]>(`${this.baseUrl}/most-purchased`, { params });
  }

  getTopRated(limit: number = 8): Observable<ProductRecommendationDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductRecommendationDto[]>(`${this.baseUrl}/top-rated`, { params });
  }

  getTrending(limit: number = 8): Observable<ProductRecommendationDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductRecommendationDto[]>(`${this.baseUrl}/trending`, { params });
  }

  getFrequentlyPurchasedTogether(productId: number, limit: number = 4): Observable<FrequentlyPurchasedTogetherDto> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<FrequentlyPurchasedTogetherDto>(`${this.baseUrl}/product/${productId}/frequently-purchased`, { params });
  }

  getUserPreferences(limit: number = 8): Observable<ProductRecommendationDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ProductRecommendationDto[]>(`${this.baseUrl}/user/preferences`, { params });
  }

  getUserCategoryStats(): Observable<UserCategoryPreferenceDto[]> {
    return this.http.get<UserCategoryPreferenceDto[]>(`${this.baseUrl}/user/category-stats`);
  }

  recordSearchActivity(query: string, categoryId?: number): Observable<void> {
    const request: SearchEventRequest = { query, categoryId };
    return this.http.post<void>(`${this.baseUrl}/events/search`, request);
  }
}
