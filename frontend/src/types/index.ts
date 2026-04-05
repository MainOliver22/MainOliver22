export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: 'FIAT' | 'CRYPTO';
  chain?: string;
  decimals: number;
}

export interface Balance {
  assetId: string;
  asset: Asset;
  balance: string;
  type: string;
}

export interface Deposit {
  id: string;
  assetId: string;
  amount: string;
  fee: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  assetId: string;
  amount: string;
  fee: string;
  method: string;
  status: string;
  createdAt: string;
}

export interface ExchangeOrder {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  fee: string;
  status: string;
  quoteExpiresAt?: string;
  createdAt: string;
}

export interface BotStrategy {
  id: string;
  name: string;
  description: string;
  type: string;
  riskLevel: string;
  maxDrawdownPercent: string;
  isActive: boolean;
}

export interface BotInstance {
  id: string;
  strategyId: string;
  strategy?: BotStrategy;
  status: string;
  allocatedAmount: string;
  currentValue: string;
  pnl: string;
  pnlPercent: string;
  createdAt: string;
}

export interface KycCase {
  id: string;
  status: string;
  level: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
