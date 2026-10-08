export interface CategoryDto {
  id?: number;
  name: string;
  description?: string;
  productCount?: number;
}

export interface ProductDto {
  id: number;
  merchantId: number;
  name: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName?: string;
  imageUrl?: string;
  active: boolean;
  specifications?: Record<string, string>;
  rating?: number;
  ratingCount?: number;
  bankOfferPrice?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl?: string;
  specifications?: Record<string, string>;
  initialStock?: number;
}

export interface ProductUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  imageUrl?: string;
  active?: boolean;
  specifications?: Record<string, string>;
}
