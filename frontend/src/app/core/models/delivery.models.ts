export type DeliveryStatus =
  | 'CREATED'
  | 'AVAILABLE'
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'RETURNED';

export interface DeliveryDto {
  id: number;
  orderId: number;
  customerId?: number;
  merchantId?: number;
  trackingNumber: string;
  deliveryAgentId?: number;
  deliveryAgentName?: string;
  deliveryAgentUsername?: string;
  status: DeliveryStatus;
  shippingAddressSnapshot?: string;
  pickupAddressSnapshot?: string;
  customerNotes?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  notes?: string;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  actualDeliveryTime?: string;
  estimatedDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryCreateRequest {
  orderId: number;
  customerId?: number;
  merchantId?: number;
  shippingAddressSnapshot?: string;
  pickupAddressSnapshot?: string;
  customerNotes?: string;
  deliveryAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface DeliveryAssignmentRequest {
  deliveryAgentId: number;
  deliveryAgentName?: string;
  notes?: string;
}

export interface DeliveryStatusUpdateRequest {
  status: DeliveryStatus;
  remarks?: string;
  notes?: string;
}
