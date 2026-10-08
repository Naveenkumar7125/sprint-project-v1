export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface PaymentDto {
  id: number;
  orderId: number;
  customerId: number;
  amount: number;
  paymentMethod: string;
  status: PaymentStatus;
  transactionReference: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentInitiateRequest {
  orderId: number;
  amount: number;
  paymentMethod: string;
}

export interface PaymentConfirmRequest {
  transactionReference: string;
}

export interface CodCollectRequest {
  collectedAmount: number;
  idempotencyKey: string;
}

export interface RefundDto {
  id: number;
  paymentId: number;
  orderId: number;
  amount: number;
  status: string;
  refundReference: string;
  reason: string;
  createdAt: string;
}

export interface RefundRequest {
  reason: string;
  amount: number;
}
