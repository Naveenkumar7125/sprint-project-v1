import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  ProductDto,
  CategoryDto,
  ProductCreateRequest,
  ProductUpdateRequest
} from '../models/product.models';
import { Page } from '../models/api-response.models';
import { SEED_CATEGORIES, SEED_PRODUCTS } from '../mocks/seed-products.data';

const PRODUCTS_STORAGE_KEY = 'esz_products_list';
const CATEGORIES_STORAGE_KEY = 'esz_categories_list';

export interface ProductFilterCriteria {
  page?: number;
  size?: number;
  sort?: string;
  category?: string | null;
  query?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRating?: number | null;
  inStockOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly baseUrl = `${environment.apiBaseUrl}/api/v1/products`;

  private inMemoryProducts: ProductDto[] = [...SEED_PRODUCTS];
  private inMemoryCategories: CategoryDto[] = [...SEED_CATEGORIES];

  constructor(private http: HttpClient) {
    this.initializeLocalStorage();
  }

  private initializeLocalStorage(): void {
    try {
      const data = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (data) {
        this.inMemoryProducts = JSON.parse(data);
      }
    } catch {
      // Ignore storage read errors
    }
  }

  private getStoredProducts(): ProductDto[] {
    try {
      const data = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return this.inMemoryProducts;
  }

  private saveStoredProducts(products: ProductDto[]): void {
    this.inMemoryProducts = products;
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products.slice(0, 50)));
    } catch (e) {
      console.warn('LocalStorage quota limit reached; products preserved in memory.');
      try {
        // Fallback: save only essential fields without heavy specs if quota full
        const minimal = products.slice(0, 20).map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          categoryId: p.categoryId,
          categoryName: p.categoryName,
          active: p.active
        }));
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(minimal));
      } catch {}
    }
  }

  private getStoredCategories(): CategoryDto[] {
    try {
      const data = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {}
    return this.inMemoryCategories;
  }

  private saveStoredCategories(categories: CategoryDto[]): void {
    this.inMemoryCategories = categories;
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage quota reached for categories.');
    }
  }

  getAllProducts(
    page: number = 0,
    size: number = 12,
    sort?: string,
    filters?: Partial<ProductFilterCriteria>
  ): Observable<Page<ProductDto>> {
    const criteria: ProductFilterCriteria = {
      page,
      size,
      sort: sort || 'createdAt,desc',
      ...filters
    };
    return this.getFilteredProducts(criteria);
  }

  getProductById(id: number): Observable<ProductDto> {
    return this.http.get<ProductDto>(`${this.baseUrl}/${id}`).pipe(
      catchError(() => {
        const found = this.getStoredProducts().find(p => p.id === Number(id)) || this.getStoredProducts()[0];
        return of(found);
      })
    );
  }

  getProductByIdSync(id: number): ProductDto | undefined {
    const list = this.getStoredProducts();
    return list.find(p => p.id === Number(id));
  }

  searchProducts(
    query: string,
    page: number = 0,
    size: number = 12,
    sort?: string,
    filters?: Partial<ProductFilterCriteria>
  ): Observable<Page<ProductDto>> {
    const criteria: ProductFilterCriteria = {
      page,
      size,
      sort: sort || 'createdAt,desc',
      query,
      ...filters
    };
    return this.getFilteredProducts(criteria);
  }

  getProductsByCategory(
    category: string,
    page: number = 0,
    size: number = 12,
    sort?: string,
    filters?: Partial<ProductFilterCriteria>
  ): Observable<Page<ProductDto>> {
    const criteria: ProductFilterCriteria = {
      page,
      size,
      sort: sort || 'createdAt,desc',
      category,
      ...filters
    };
    return this.getFilteredProducts(criteria);
  }

  getFilteredProducts(criteria: ProductFilterCriteria): Observable<Page<ProductDto>> {
    const page = criteria.page ?? 0;
    const size = criteria.size ?? 12;
    const sort = criteria.sort || 'createdAt,desc';

    let endpoint = this.baseUrl;
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (criteria.category) {
      endpoint = `${this.baseUrl}/category/${encodeURIComponent(criteria.category)}`;
    } else if (criteria.query) {
      endpoint = `${this.baseUrl}/search`;
      params = params.set('query', criteria.query);
    }

    if (criteria.minPrice != null && criteria.minPrice > 0) {
      params = params.set('minPrice', criteria.minPrice.toString());
    }
    if (criteria.maxPrice != null && criteria.maxPrice > 0) {
      params = params.set('maxPrice', criteria.maxPrice.toString());
    }

    return this.http.get<Page<ProductDto>>(endpoint, { params }).pipe(
      catchError(() => of(this.applyMockFiltersAndSort(criteria)))
    );
  }

  getAllCategories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.baseUrl}/categories`).pipe(
      map(res => (res && res.length > 0) ? res : this.getStoredCategories()),
      catchError(() => of(this.getStoredCategories()))
    );
  }

  createCategory(category: CategoryDto): Observable<CategoryDto> {
    const newCategory: CategoryDto = {
      ...category,
      id: category.id || (Date.now() % 100000),
      productCount: 0
    };

    return this.http.post<CategoryDto>(`${this.baseUrl}/categories`, category).pipe(
      tap(created => {
        const list = this.getStoredCategories();
        list.push(created || newCategory);
        this.saveStoredCategories(list);
      }),
      catchError(() => {
        const list = this.getStoredCategories();
        list.push(newCategory);
        this.saveStoredCategories(list);
        return of(newCategory);
      })
    );
  }

  updateCategory(id: number, category: Partial<CategoryDto>): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/categories/${id}`, category).pipe(
      tap(updated => {
        const list = this.getStoredCategories().map(c => c.id === id ? { ...c, ...category, ...(updated || {}) } : c);
        this.saveStoredCategories(list);
      }),
      catchError(() => {
        const list = this.getStoredCategories().map(c => c.id === id ? { ...c, ...category } : c);
        this.saveStoredCategories(list);
        const found = list.find(c => c.id === id);
        return of(found || ({ id, name: category.name || 'Updated Category', ...category } as CategoryDto));
      })
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`).pipe(
      tap(() => {
        const list = this.getStoredCategories().filter(c => c.id !== id);
        this.saveStoredCategories(list);
      }),
      catchError((err) => {
        // If server returned an error (e.g. products attached), bubble it up
        if (err.status === 409 || err.status === 400 || err.status === 403) {
          throw err;
        }
        const list = this.getStoredCategories().filter(c => c.id !== id);
        this.saveStoredCategories(list);
        return of(void 0);
      })
    );
  }

  createProduct(request: ProductCreateRequest): Observable<ProductDto> {
    const categories = this.getStoredCategories();
    const cat = categories.find(c => c.id === request.categoryId);

    const newProduct: ProductDto = {
      id: Date.now(),
      merchantId: 1,
      categoryId: request.categoryId,
      categoryName: cat?.name || 'General',
      name: request.name,
      description: request.description,
      price: Number(request.price),
      imageUrl: request.imageUrl || '',
      active: true,
      specifications: request.specifications || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.http.post<ProductDto>(this.baseUrl, request).pipe(
      tap(created => {
        const list = this.getStoredProducts();
        list.unshift(created || newProduct);
        this.saveStoredProducts(list);
      }),
      catchError(() => {
        const list = this.getStoredProducts();
        list.unshift(newProduct);
        this.saveStoredProducts(list);
        return of(newProduct);
      })
    );
  }

  updateProduct(id: number, request: ProductUpdateRequest): Observable<ProductDto> {
    return this.http.put<ProductDto>(`${this.baseUrl}/${id}`, request).pipe(
      tap(updated => {
        this.updateLocalProduct(id, request, updated);
      }),
      catchError(() => {
        const updated = this.updateLocalProduct(id, request);
        return of(updated!);
      })
    );
  }

  private updateLocalProduct(id: number, request: ProductUpdateRequest, apiResult?: ProductDto): ProductDto | undefined {
    const list = this.getStoredProducts();
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      if (apiResult) {
        list[index] = apiResult;
      } else {
        list[index] = {
          ...list[index],
          name: request.name ?? list[index].name,
          description: request.description ?? list[index].description,
          price: request.price ? Number(request.price) : list[index].price,
          imageUrl: request.imageUrl ?? list[index].imageUrl,
          active: request.active !== undefined ? request.active : list[index].active,
          specifications: request.specifications ?? list[index].specifications,
          updatedAt: new Date().toISOString()
        };
      }
      this.saveStoredProducts(list);
      return list[index];
    }
    return undefined;
  }

  updateProductStatus(id: number, active: boolean): Observable<ProductDto> {
    return this.http.patch<ProductDto>(`${this.baseUrl}/${id}/status`, null, {
      params: { active: active.toString() }
    }).pipe(
      tap(updated => {
        this.updateLocalProduct(id, { active }, updated);
      }),
      catchError(() => {
        const updated = this.updateLocalProduct(id, { active });
        return of(updated!);
      })
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        const list = this.getStoredProducts().filter(p => p.id !== id);
        this.saveStoredProducts(list);
      }),
      catchError(() => {
        const list = this.getStoredProducts().filter(p => p.id !== id);
        this.saveStoredProducts(list);
        return of(void 0);
      })
    );
  }

  /**
   * Comprehensive client-side filtering, searching, and sorting engine
   */
  public applyMockFiltersAndSort(criteria: ProductFilterCriteria): Page<ProductDto> {
    const all = this.getStoredProducts();
    let filtered = [...all];

    // 1. Category filter
    if (criteria.category && criteria.category.toLowerCase() !== 'all') {
      const catNorm = criteria.category.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.categoryName?.toLowerCase() === catNorm ||
        p.categoryId?.toString() === catNorm
      );
    }

    // 2. Keyword Search filter
    if (criteria.query && criteria.query.trim().length > 0) {
      const q = criteria.query.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    // 3. Min Price filter
    if (criteria.minPrice != null && !isNaN(criteria.minPrice)) {
      filtered = filtered.filter(p => Number(p.price) >= Number(criteria.minPrice));
    }

    // 4. Max Price filter
    if (criteria.maxPrice != null && !isNaN(criteria.maxPrice) && criteria.maxPrice > 0) {
      filtered = filtered.filter(p => Number(p.price) <= Number(criteria.maxPrice));
    }

    // 5. Min Rating filter
    if (criteria.minRating != null && criteria.minRating > 0) {
      filtered = filtered.filter(p => (Number(p.rating) || 4.5) >= Number(criteria.minRating));
    }

    // 6. In Stock Only filter
    if (criteria.inStockOnly) {
      filtered = filtered.filter(p => p.active !== false);
    }

    // 7. Robust Multi-Criteria Sorting
    const sort = criteria.sort || 'createdAt,desc';
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price,asc':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price,desc':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'name,asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name,desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'rating,desc':
          return (Number(b.rating) || 4.5) - (Number(a.rating) || 4.5);
        case 'createdAt,asc':
          return (a.createdAt ? new Date(a.createdAt).getTime() : a.id) - (b.createdAt ? new Date(b.createdAt).getTime() : b.id);
        case 'createdAt,desc':
        default:
          return (b.createdAt ? new Date(b.createdAt).getTime() : b.id) - (a.createdAt ? new Date(a.createdAt).getTime() : a.id);
      }
    });

    // 8. Pagination Slice
    const page = criteria.page ?? 0;
    const size = criteria.size ?? 12;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    return {
      content,
      pageable: {
        pageNumber: page,
        pageSize: size,
        sort: { empty: false, sorted: true, unsorted: false },
        offset: start,
        paged: true,
        unpaged: false
      },
      totalPages,
      totalElements,
      last: page >= totalPages - 1,
      size,
      number: page,
      sort: { empty: false, sorted: true, unsorted: false },
      numberOfElements: content.length,
      first: page === 0,
      empty: content.length === 0
    };
  }
}
