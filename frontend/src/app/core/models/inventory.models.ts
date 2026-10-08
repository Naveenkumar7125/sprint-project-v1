export interface InventoryDto {
  id?: number;
  productId: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  totalStock?: number;
  lowStockThreshold?: number;
  // Aliases for compatibility
  availableQuantity?: number;
  reservedQuantity?: number;
  soldQuantity?: number;
  updatedAt?: string;
  lastUpdated?: string;
}

export interface StockUpdateRequest {
  productId: number;
  availableStock: number;
  quantity?: number;
  lowStockThreshold?: number;
}

