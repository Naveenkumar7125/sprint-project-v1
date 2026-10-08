export interface ProductRecommendationDto {
  productId: number;
  id?: number;
  name?: string;
  productName?: string;
  description?: string;
  categoryName?: string;
  price: number;
  imageUrl?: string;
  merchantId?: number;
  searchCount?: number;
  purchaseCount?: number;
  averageRating?: number;
  rating?: number;
  ratingCount?: number;
  popularityScore?: number;
  score?: number;
  recommendationReason?: string;
  specifications?: Record<string, string>;
}

export interface RecommendedItem {
  productId: number;
  name: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  coPurchaseFrequency?: number;
  averageRating?: number;
  ratingCount?: number;
}

export interface FrequentlyPurchasedTogetherDto {
  primaryProductId?: number;
  primaryProductName?: string;
  targetProductId?: number;
  targetProductName?: string;
  frequentlyPurchasedItems?: RecommendedItem[];
  frequentlyBoughtWith?: ProductRecommendationDto[];
}

export interface UserCategoryPreferenceDto {
  categoryId: number;
  categoryName: string;
  interactionCount: number;
  lastInteractedAt?: string;
  lastInteractionAt?: string;
}

export interface SearchEventRequest {
  query: string;
  categoryId?: number;
  categoryName?: string;
  matchedProductIds?: number[];
}
