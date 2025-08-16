// Types for Transactions feature

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TransactionType = 'purchase' | 'subscription' | 'refund' | 'credit';

export interface Transaction {
  _id: string;
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string;
  description: string;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType | '';
  status?: TransactionStatus | '';
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}