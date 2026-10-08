import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ReviewDto,
  ProductReviewSummaryDto,
  ReviewCreateRequest,
  ReviewUpdateRequest
} from '../models/review.models';
import { Page } from '../models/api-response.models';
import { ToastService } from './toast.service';

import { AuthService } from '../auth/auth.service';

const REVIEWS_STORAGE_KEY = 'esz_product_reviews';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/reviews`;

  constructor(
    private http: HttpClient,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.initializeSampleReviews();
  }

  private initializeSampleReviews(): void {
    if (!localStorage.getItem(REVIEWS_STORAGE_KEY)) {
      const initialReviews: ReviewDto[] = [
        {
          id: 1,
          productId: 1,
          customerId: 101,
          customerUsername: 'Alex Johnson',
          rating: 5,
          title: 'Stunning display and lightning fast performance!',
          comment: 'The 200MP camera produces crystal clear detail even in dim lighting, and the battery easily lasts 2 full days.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 2,
          productId: 1,
          customerId: 102,
          customerUsername: 'Sarah Jenkins',
          rating: 4,
          title: 'Premium build quality & super fast charging',
          comment: 'Super fast charging and smooth 120Hz AMOLED display. Overall exceptional flagship phone.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          productId: 2,
          customerId: 103,
          customerUsername: 'David Miller',
          rating: 5,
          title: 'A beast for video editing & development',
          comment: 'The M3 Pro chip handles 4K rendering seamlessly without any fan noise. Battery life is incredible.',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 4,
          productId: 3,
          customerId: 104,
          customerUsername: 'Priya Sharma',
          rating: 5,
          title: 'Cinematic experience right in my living room',
          comment: '3000 ANSI lumens gives bright vibrant pictures even with ambient light. Audio is surprisingly rich.',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date(Date.now() - 345600000).toISOString()
        },
        {
          id: 5,
          productId: 4,
          customerId: 105,
          customerUsername: 'Vikram Patel',
          rating: 4,
          title: 'Great tablet for notes and media consumption',
          comment: 'Lightweight, snappy performance, and great speakers for movies.',
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          updatedAt: new Date(Date.now() - 432000000).toISOString()
        }
      ];
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(initialReviews));
    }
  }

  public getStoredReviews(): ReviewDto[] {
    try {
      const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveStoredReviews(reviews: ReviewDto[]): void {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
  }

  public getRatingForProductSync(productId: number): { averageRating: number; totalReviews: number } {
    const list = this.getStoredReviews();
    const reviews = list.filter(r => Number(r.productId) === Number(productId));
    if (!reviews.length) {
      return { averageRating: 0, totalReviews: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    const avg = Number((sum / reviews.length).toFixed(1));
    return { averageRating: avg, totalReviews: reviews.length };
  }

  getProductReviews(productId: number, page: number = 0, size: number = 10): Observable<Page<ReviewDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Page<ReviewDto>>(`${this.baseUrl}/product/${productId}`, { params }).pipe(
      tap(res => {
        if (res && res.content && res.content.length > 0) {
          const list = this.getStoredReviews();
          for (const item of res.content) {
            const idx = list.findIndex(r => r.id === item.id);
            if (idx >= 0) {
              list[idx] = item;
            } else {
              list.push(item);
            }
          }
          this.saveStoredReviews(list);
        }
      }),
      map(res => {
        if (!res || !res.content || res.content.length === 0) {
          const list = this.getStoredReviews().filter(r => Number(r.productId) === Number(productId));
          return this.paginateReviews(list, page, size);
        }
        return res;
      }),
      catchError(() => {
        const list = this.getStoredReviews().filter(r => Number(r.productId) === Number(productId));
        return of(this.paginateReviews(list, page, size));
      })
    );
  }

  getProductSummary(productId: number): Observable<ProductReviewSummaryDto> {
    return this.http.get<ProductReviewSummaryDto>(`${this.baseUrl}/product/${productId}/summary`).pipe(
      tap(summary => {
        if (summary && summary.recentReviews && summary.recentReviews.length > 0) {
          const list = this.getStoredReviews();
          for (const item of summary.recentReviews) {
            const idx = list.findIndex(r => r.id === item.id);
            if (idx >= 0) {
              list[idx] = item;
            } else {
              list.push(item);
            }
          }
          this.saveStoredReviews(list);
        }
      }),
      catchError(() => {
        const reviews = this.getStoredReviews().filter(r => Number(r.productId) === Number(productId));
        const count = reviews.length;
        const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
        const avg = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

        const summary: ProductReviewSummaryDto = {
          productId,
          averageRating: avg,
          totalReviews: count,
          recentReviews: reviews.slice(0, 3)
        };
        return of(summary);
      })
    );
  }

  createReview(productIdOrRequest: any, maybeRequest?: any): Observable<ReviewDto> {
    let productId = 1;
    let request: ReviewCreateRequest;

    if (typeof productIdOrRequest === 'number') {
      productId = productIdOrRequest;
      request = maybeRequest;
    } else {
      request = productIdOrRequest;
      productId = request?.productId || 1;
    }

    const payload = {
      productId: Number(productId),
      rating: Number(request.rating),
      title: request.title,
      comment: request.comment
    };

    return this.http.post<ReviewDto>(this.baseUrl, payload).pipe(
      tap(review => {
        this.addLocalReview(productId, request, review);
        this.toast.success('Thank you! Your review has been published.');
      }),
      catchError(() => {
        const review = this.addLocalReview(productId, request);
        this.toast.success('Thank you! Your review has been published.');
        return of(review);
      })
    );
  }

  private addLocalReview(productId: number, request: ReviewCreateRequest, apiResult?: ReviewDto): ReviewDto {
    const list = this.getStoredReviews();
    const user = this.authService.currentUser();
    const newRev: ReviewDto = apiResult || {
      id: Date.now(),
      productId,
      customerId: user?.id || 1,
      customerUsername: user?.username || 'Verified Shopper',
      rating: request.rating,
      title: request.title,
      comment: request.comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.unshift(newRev);
    this.saveStoredReviews(list);
    return newRev;
  }

  updateReview(id: number, request: ReviewUpdateRequest): Observable<ReviewDto> {
    return this.http.put<ReviewDto>(`${this.baseUrl}/${id}`, request).pipe(
      tap(review => {
        this.updateLocalReview(id, request, review);
        this.toast.success('Review updated.');
      }),
      catchError(() => {
        const review = this.updateLocalReview(id, request);
        this.toast.success('Review updated.');
        return of(review!);
      })
    );
  }

  private updateLocalReview(id: number, request: ReviewUpdateRequest, apiResult?: ReviewDto): ReviewDto | undefined {
    const list = this.getStoredReviews();
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      if (apiResult) {
        list[index] = apiResult;
      } else {
        list[index] = {
          ...list[index],
          rating: request.rating ?? list[index].rating,
          title: request.title ?? list[index].title,
          comment: request.comment ?? list[index].comment,
          updatedAt: new Date().toISOString()
        };
      }
      this.saveStoredReviews(list);
      return list[index];
    }
    return undefined;
  }

  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.deleteLocalReview(id);
        this.toast.info('Review deleted.');
      }),
      catchError(() => {
        this.deleteLocalReview(id);
        this.toast.info('Review deleted.');
        return of(void 0);
      })
    );
  }

  private deleteLocalReview(id: number): void {
    const list = this.getStoredReviews().filter(r => r.id !== id);
    this.saveStoredReviews(list);
  }

  private paginateReviews(list: ReviewDto[], page: number, size: number): Page<ReviewDto> {
    const start = page * size;
    const content = list.slice(start, start + size);
    const totalElements = list.length;
    const totalPages = Math.ceil(totalElements / size);

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
