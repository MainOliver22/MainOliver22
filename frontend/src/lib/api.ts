import axios from 'axios';
import Cookies from 'js-cookie';
import type {
  Asset,
  Balance,
  Deposit,
  Withdrawal,
  ExchangeOrder,
  BotStrategy,
  BotInstance,
  KycCase,
  Notification,
  User,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 and refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          Cookies.set('accessToken', data.accessToken, { expires: 1 });
          Cookies.set('refreshToken', data.refreshToken, { expires: 30 });
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Typed API modules
// All methods use the shared axios instance (auth token auto-attached).
// ---------------------------------------------------------------------------

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/login', credentials).then(r => r.data),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post<{ message: string }>('/auth/register', data).then(r => r.data),
};

export const assetsApi = {
  getAll: () => api.get<Asset[]>('/assets').then(r => r.data),
};

export const walletApi = {
  getBalances: () =>
    api.get<{ balances: Balance[] }>('/portfolio/balances').then(r => r.data.balances),

  createDeposit: (body: { assetId: string; amount: string; method: string }) =>
    api.post<Deposit>('/deposit/create', body).then(r => r.data),

  getDepositHistory: () =>
    api.get<{ deposits: Deposit[] }>('/deposit/history').then(r => r.data.deposits),

  createWithdrawal: (body: { assetId: string; amount: string; method: string; toAddress?: string }) =>
    api.post<Withdrawal>('/withdraw/create', body).then(r => r.data),

  getWithdrawalHistory: () =>
    api.get<{ withdrawals: Withdrawal[] }>('/withdraw/history').then(r => r.data.withdrawals),
};

export const exchangeApi = {
  getQuote: (body: { fromAssetId: string; toAssetId: string; fromAmount: string }) =>
    api.post<ExchangeOrder>('/exchange/quote', body).then(r => r.data),

  executeTrade: (quoteId: string) =>
    api.post<ExchangeOrder>('/exchange/execute', { quoteId }).then(r => r.data),

  getHistory: () =>
    api.get<{ orders: ExchangeOrder[] }>('/exchange/history').then(r => r.data.orders),
};

export const botsApi = {
  getStrategies: () =>
    api.get<{ strategies: BotStrategy[] }>('/bots/strategies').then(r => r.data.strategies),

  getInstances: () =>
    api.get<{ instances: BotInstance[] }>('/bots/instances').then(r => r.data.instances),

  createBot: (body: { strategyId: string; allocatedAmount: string }) =>
    api.post<BotInstance>('/bots/create-instance', body).then(r => r.data),

  pauseBot: (id: string) =>
    api.patch<BotInstance>(`/bots/instances/${id}/pause`).then(r => r.data),

  stopBot: (id: string) =>
    api.patch<BotInstance>(`/bots/instances/${id}/stop`).then(r => r.data),
};

export const kycApi = {
  getStatus: () =>
    api.get<KycCase>('/kyc/status').then(r => r.data),

  start: (level: string = 'BASIC') =>
    api.post<{ kycCase: KycCase; redirectUrl?: string }>('/kyc/start', { level }).then(r => r.data),
};

export const ledgerApi = {
  getEntries: () =>
    api.get<{ entries: Array<{ id: string; type: string; amount: string; asset?: { symbol: string }; description?: string; createdAt: string }> }>('/portfolio/ledger').then(r => r.data.entries),
};

export const notificationsApi = {
  getAll: () =>
    api.get<{ notifications: Notification[] }>('/notifications').then(r => r.data.notifications),

  markRead: (id: string) =>
    api.patch(`/notifications/${id}/read`).then(r => r.data),
};

interface AdminDashStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalDepositsToday: number;
  totalWithdrawalsToday: number;
  activeBots: number;
}

interface KycCaseAdmin {
  id: string;
  status: string;
  level: string;
  user?: { email: string; firstName: string; lastName: string };
  submittedAt?: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export const adminApi = {
  getDashboard: () =>
    api.get<AdminDashStats>('/admin/dashboard').then(r => r.data),

  getUsers: (page = 1, limit = 20) =>
    api.get<{ users: User[]; total: number }>(`/admin/users?page=${page}&limit=${limit}`).then(r => r.data),

  freezeUser: (id: string) =>
    api.patch(`/admin/users/${id}/freeze`).then(r => r.data),

  unfreezeUser: (id: string) =>
    api.patch(`/admin/users/${id}/unfreeze`).then(r => r.data),

  getKycCases: (page = 1, limit = 50) =>
    api.get<{ cases: KycCaseAdmin[] }>(`/admin/kyc?page=${page}&limit=${limit}`).then(r => r.data.cases),

  approveKyc: (id: string) =>
    api.patch(`/admin/kyc/${id}/approve`).then(r => r.data),

  rejectKyc: (id: string, reason: string) =>
    api.patch(`/admin/kyc/${id}/reject`, { reason }).then(r => r.data),

  getAuditLogs: (action = '', page = 1, limit = 50) =>
    api.get<{ logs: AuditLog[] }>(`/admin/audit-logs?action=${action}&page=${page}&limit=${limit}`).then(r => r.data.logs),
};

export default api;
