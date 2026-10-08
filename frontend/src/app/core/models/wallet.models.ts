export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';
export type TransactionType = 'CREDIT' | 'DEBIT' | 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface WalletDto {
  id: number;
  userId: number;
  role: string;
  balance: number;
  pendingBalance?: number;
  availableBalance?: number;
  totalEarnings?: number;
  currency: string;
  status: WalletStatus;
  version?: number;
  createdAt: string;
  updatedAt: string;
}

export type SettlementStatus = 'PENDING' | 'AVAILABLE' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

export interface SettlementDto {
  id: number;
  orderId: number;
  orderNumber: string;
  merchantId: number;
  grossAmount: number;
  commissionPercentage: number;
  platformCommission: number;
  merchantAmount: number;
  status: SettlementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MerchantWalletDto {
  id: number;
  merchantId: number;
  pendingBalance: number;
  availableBalance: number;
  totalBalance: number;
  totalEarnings: number;
  currency: string;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCommissionSummaryDto {
  configuredCommissionPercentage: number;
  totalGrossMerchandiseValue: number;
  totalPlatformCommission: number;
  pendingPlatformCommission: number;
  settledPlatformCommission: number;
  totalSettlementsCount: number;
  pendingSettlementsCount: number;
  completedSettlementsCount: number;
  cancelledSettlementsCount: number;
}

export interface WalletTransactionDto {
  id: number;
  transactionReference: string;
  walletId: number;
  userId: number;
  transactionType: TransactionType;
  amount: number;
  balanceAfter: number;
  status: TransactionStatus;
  description: string;
  sourceParty?: string;
  destinationParty?: string;
  createdAt: string;
}

export interface WalletTopUpRequest {
  amount: number;
  referenceId: string;
}
