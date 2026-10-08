export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'WALLET' | 'CASH_ON_DELIVERY';

export interface OrderItemDto {
  id?: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  merchantId: number;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderDto {
  id: number;
  orderNumber: string;
  customerId: number;
  customerUsername: string;
  customerEmail: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  shippingAddressId: number;
  shippingAddressSnapshot: string;
  cancellationReason?: string;
  items: OrderItemDto[];
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemRequest {
  productId: number;
  quantity: number;
}

export interface OrderCreateRequest {
  shippingAddressId: number;
  shippingAddressSnapshot?: string;
  paymentMethod: PaymentMethod;
  items: OrderItemRequest[];
}

export interface OrderCancelRequest {
  reason?: string;
}
