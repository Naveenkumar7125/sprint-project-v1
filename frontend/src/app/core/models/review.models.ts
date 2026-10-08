export interface ReviewDto {
  id: number;
  productId: number;
  customerId: number;
  customerUsername: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReviewSummaryDto {
  productId: number;
  averageRating: number;
  totalReviews: number;
  recentReviews?: ReviewDto[];
}

export interface ReviewCreateRequest {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}

export interface ReviewUpdateRequest {
  rating: number;
  title: string;
  comment: string;
}
