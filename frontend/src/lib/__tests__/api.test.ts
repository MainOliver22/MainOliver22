/**
 * Integration tests for the API client layer (lib/api.ts).
 *
 * These tests verify that every typed API module sends requests to the correct
 * NestJS endpoint with the right HTTP method, path, and payload shape.  HTTP is
 * intercepted by axios-mock-adapter so no live backend is required.
 */

import MockAdapter from 'axios-mock-adapter';
import api, {
  authApi,
  assetsApi,
  walletApi,
  exchangeApi,
  botsApi,
  kycApi,
  ledgerApi,
  notificationsApi,
  adminApi,
} from '../api';

// Suppress js-cookie in a Node environment (no DOM)
jest.mock('js-cookie', () => ({
  get: jest.fn().mockReturnValue(undefined),
  set: jest.fn(),
  remove: jest.fn(),
}));

const mock = new MockAdapter(api);

afterEach(() => {
  mock.reset();
});

// ---------------------------------------------------------------------------
// authApi
// ---------------------------------------------------------------------------
describe('authApi', () => {
  it('login → POST /auth/login with credentials', async () => {
    const payload = { accessToken: 'access', refreshToken: 'refresh' };
    mock.onPost('/auth/login').reply(200, payload);

    const result = await authApi.login({ email: 'a@b.com', password: 'secret' });
    expect(result).toEqual(payload);
    expect(mock.history.post[0].url).toBe('/auth/login');
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ email: 'a@b.com' });
  });

  it('register → POST /auth/register', async () => {
    const payload = { message: 'Registration successful' };
    mock.onPost('/auth/register').reply(201, payload);

    const result = await authApi.register({
      email: 'new@user.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(result).toEqual(payload);
  });
});

// ---------------------------------------------------------------------------
// assetsApi
// ---------------------------------------------------------------------------
describe('assetsApi', () => {
  it('getAll → GET /assets', async () => {
    const assets = [{ id: '1', symbol: 'BTC', name: 'Bitcoin', type: 'CRYPTO', decimals: 8 }];
    mock.onGet('/assets').reply(200, assets);

    const result = await assetsApi.getAll();
    expect(result).toEqual(assets);
    expect(mock.history.get[0].url).toBe('/assets');
  });
});

// ---------------------------------------------------------------------------
// walletApi
// ---------------------------------------------------------------------------
describe('walletApi', () => {
  it('getBalances → GET /portfolio/balances', async () => {
    const balances = [{ assetId: '1', asset: { symbol: 'BTC' }, balance: '0.5', type: 'SPOT' }];
    mock.onGet('/portfolio/balances').reply(200, { balances });

    const result = await walletApi.getBalances();
    expect(result).toEqual(balances);
  });

  it('createDeposit → POST /deposit/create', async () => {
    const deposit = { id: 'd1', assetId: '1', amount: '100', fee: '0', method: 'BANK', status: 'PENDING', createdAt: '' };
    mock.onPost('/deposit/create').reply(201, deposit);

    const result = await walletApi.createDeposit({ assetId: '1', amount: '100', method: 'BANK' });
    expect(result).toEqual(deposit);
    expect(mock.history.post[0].url).toBe('/deposit/create');
  });

  it('getDepositHistory → GET /deposit/history', async () => {
    const deposits = [{ id: 'd1', assetId: '1', amount: '100', fee: '0', method: 'BANK', status: 'COMPLETE', createdAt: '' }];
    mock.onGet('/deposit/history').reply(200, { deposits });

    const result = await walletApi.getDepositHistory();
    expect(result).toEqual(deposits);
  });

  it('createWithdrawal → POST /withdraw/create', async () => {
    const withdrawal = { id: 'w1', assetId: '1', amount: '50', fee: '1', method: 'BANK', status: 'PENDING', createdAt: '' };
    mock.onPost('/withdraw/create').reply(201, withdrawal);

    const result = await walletApi.createWithdrawal({ assetId: '1', amount: '50', method: 'BANK' });
    expect(result).toEqual(withdrawal);
  });

  it('getWithdrawalHistory → GET /withdraw/history', async () => {
    const withdrawals = [{ id: 'w1', assetId: '1', amount: '50', fee: '1', method: 'BANK', status: 'COMPLETE', createdAt: '' }];
    mock.onGet('/withdraw/history').reply(200, { withdrawals });

    const result = await walletApi.getWithdrawalHistory();
    expect(result).toEqual(withdrawals);
  });
});

// ---------------------------------------------------------------------------
// exchangeApi
// ---------------------------------------------------------------------------
describe('exchangeApi', () => {
  it('getQuote → POST /exchange/quote', async () => {
    const order = { id: 'q1', fromAssetId: '1', toAssetId: '2', fromAmount: '100', toAmount: '95', rate: '0.95', fee: '5', status: 'QUOTED', createdAt: '' };
    mock.onPost('/exchange/quote').reply(200, order);

    const result = await exchangeApi.getQuote({ fromAssetId: '1', toAssetId: '2', fromAmount: '100' });
    expect(result).toEqual(order);
    const body = JSON.parse(mock.history.post[0].data);
    expect(body).toMatchObject({ fromAssetId: '1', toAssetId: '2', fromAmount: '100' });
  });

  it('executeTrade → POST /exchange/execute', async () => {
    const order = { id: 'q1', fromAssetId: '1', toAssetId: '2', fromAmount: '100', toAmount: '95', rate: '0.95', fee: '5', status: 'COMPLETED', createdAt: '' };
    mock.onPost('/exchange/execute').reply(200, order);

    const result = await exchangeApi.executeTrade('q1');
    expect(result).toEqual(order);
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ quoteId: 'q1' });
  });

  it('getHistory → GET /exchange/history', async () => {
    const orders = [{ id: 'o1', fromAssetId: '1', toAssetId: '2', fromAmount: '100', toAmount: '95', rate: '0.95', fee: '5', status: 'COMPLETED', createdAt: '' }];
    mock.onGet('/exchange/history').reply(200, { orders });

    const result = await exchangeApi.getHistory();
    expect(result).toEqual(orders);
  });
});

// ---------------------------------------------------------------------------
// botsApi
// ---------------------------------------------------------------------------
describe('botsApi', () => {
  it('getStrategies → GET /bots/strategies', async () => {
    const strategies = [{ id: 's1', name: 'DCA', description: '', type: 'DCA', riskLevel: 'LOW', maxDrawdownPercent: '10', isActive: true }];
    mock.onGet('/bots/strategies').reply(200, { strategies });

    const result = await botsApi.getStrategies();
    expect(result).toEqual(strategies);
  });

  it('getInstances → GET /bots/instances', async () => {
    const instances = [{ id: 'i1', strategyId: 's1', status: 'RUNNING', allocatedAmount: '1000', currentValue: '1050', pnl: '50', pnlPercent: '5', createdAt: '' }];
    mock.onGet('/bots/instances').reply(200, { instances });

    const result = await botsApi.getInstances();
    expect(result).toEqual(instances);
  });

  it('createBot → POST /bots/create-instance', async () => {
    const instance = { id: 'i2', strategyId: 's1', status: 'RUNNING', allocatedAmount: '500', currentValue: '500', pnl: '0', pnlPercent: '0', createdAt: '' };
    mock.onPost('/bots/create-instance').reply(201, instance);

    const result = await botsApi.createBot({ strategyId: 's1', allocatedAmount: '500' });
    expect(result).toEqual(instance);
  });

  it('pauseBot → PATCH /bots/instances/:id/pause', async () => {
    const instance = { id: 'i1', status: 'PAUSED', strategyId: 's1', allocatedAmount: '500', currentValue: '500', pnl: '0', pnlPercent: '0', createdAt: '' };
    mock.onPatch('/bots/instances/i1/pause').reply(200, instance);

    const result = await botsApi.pauseBot('i1');
    expect(result.status).toBe('PAUSED');
    expect(mock.history.patch[0].url).toBe('/bots/instances/i1/pause');
  });

  it('stopBot → PATCH /bots/instances/:id/stop', async () => {
    const instance = { id: 'i1', status: 'STOPPED', strategyId: 's1', allocatedAmount: '500', currentValue: '500', pnl: '0', pnlPercent: '0', createdAt: '' };
    mock.onPatch('/bots/instances/i1/stop').reply(200, instance);

    const result = await botsApi.stopBot('i1');
    expect(result.status).toBe('STOPPED');
  });
});

// ---------------------------------------------------------------------------
// kycApi
// ---------------------------------------------------------------------------
describe('kycApi', () => {
  it('getStatus → GET /kyc/status', async () => {
    const kycCase = { id: 'k1', status: 'PENDING', level: 'BASIC', createdAt: '' };
    mock.onGet('/kyc/status').reply(200, kycCase);

    const result = await kycApi.getStatus();
    expect(result).toEqual(kycCase);
  });

  it('start → POST /kyc/start with level', async () => {
    const response = { kycCase: { id: 'k1', status: 'PENDING', level: 'BASIC', createdAt: '' } };
    mock.onPost('/kyc/start').reply(201, response);

    const result = await kycApi.start('BASIC');
    expect(result).toEqual(response);
    expect(JSON.parse(mock.history.post[0].data)).toMatchObject({ level: 'BASIC' });
  });
});

// ---------------------------------------------------------------------------
// ledgerApi
// ---------------------------------------------------------------------------
describe('ledgerApi', () => {
  it('getEntries → GET /portfolio/ledger', async () => {
    const entries = [{ id: 'e1', type: 'DEPOSIT', amount: '100', description: 'Deposit', createdAt: '' }];
    mock.onGet('/portfolio/ledger').reply(200, { entries });

    const result = await ledgerApi.getEntries();
    expect(result).toEqual(entries);
  });
});

// ---------------------------------------------------------------------------
// notificationsApi
// ---------------------------------------------------------------------------
describe('notificationsApi', () => {
  it('getAll → GET /notifications', async () => {
    const notifications = [{ id: 'n1', type: 'INFO', title: 'Hello', message: 'World', isRead: false, createdAt: '' }];
    mock.onGet('/notifications').reply(200, { notifications });

    const result = await notificationsApi.getAll();
    expect(result).toEqual(notifications);
  });

  it('markRead → PATCH /notifications/:id/read', async () => {
    mock.onPatch('/notifications/n1/read').reply(200, {});

    await notificationsApi.markRead('n1');
    expect(mock.history.patch[0].url).toBe('/notifications/n1/read');
  });
});

// ---------------------------------------------------------------------------
// adminApi
// ---------------------------------------------------------------------------
describe('adminApi', () => {
  it('getDashboard → GET /admin/dashboard', async () => {
    const stats = { totalUsers: 100, activeUsers: 80, pendingKyc: 5, totalDepositsToday: 1000, totalWithdrawalsToday: 500, activeBots: 20 };
    mock.onGet('/admin/dashboard').reply(200, stats);

    const result = await adminApi.getDashboard();
    expect(result).toEqual(stats);
  });

  it('getUsers → GET /admin/users with pagination', async () => {
    const users = [{ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'USER', status: 'ACTIVE', emailVerified: true, createdAt: '' }];
    mock.onGet('/admin/users?page=1&limit=20').reply(200, { users, total: 1 });

    const result = await adminApi.getUsers(1, 20);
    expect(result.users).toEqual(users);
    expect(result.total).toBe(1);
  });

  it('freezeUser → PATCH /admin/users/:id/freeze', async () => {
    mock.onPatch('/admin/users/u1/freeze').reply(200, {});

    await adminApi.freezeUser('u1');
    expect(mock.history.patch[0].url).toBe('/admin/users/u1/freeze');
  });

  it('unfreezeUser → PATCH /admin/users/:id/unfreeze', async () => {
    mock.onPatch('/admin/users/u1/unfreeze').reply(200, {});

    await adminApi.unfreezeUser('u1');
    expect(mock.history.patch[0].url).toBe('/admin/users/u1/unfreeze');
  });

  it('getKycCases → GET /admin/kyc with pagination', async () => {
    const cases = [{ id: 'k1', status: 'PENDING', level: 'BASIC', createdAt: '' }];
    mock.onGet('/admin/kyc?page=1&limit=50').reply(200, { cases });

    const result = await adminApi.getKycCases(1, 50);
    expect(result).toEqual(cases);
  });

  it('approveKyc → PATCH /admin/kyc/:id/approve', async () => {
    mock.onPatch('/admin/kyc/k1/approve').reply(200, {});

    await adminApi.approveKyc('k1');
    expect(mock.history.patch[0].url).toBe('/admin/kyc/k1/approve');
  });

  it('rejectKyc → PATCH /admin/kyc/:id/reject with reason', async () => {
    mock.onPatch('/admin/kyc/k1/reject').reply(200, {});

    await adminApi.rejectKyc('k1', 'Docs unclear');
    expect(JSON.parse(mock.history.patch[0].data)).toMatchObject({ reason: 'Docs unclear' });
  });

  it('getAuditLogs → GET /admin/audit-logs with filters', async () => {
    const logs = [{ id: 'l1', actorRole: 'ADMIN', action: 'FREEZE_USER', targetType: 'User', details: {}, createdAt: '' }];
    mock.onGet('/admin/audit-logs?action=FREEZE_USER&page=1&limit=50').reply(200, { logs });

    const result = await adminApi.getAuditLogs('FREEZE_USER', 1, 50);
    expect(result).toEqual(logs);
  });
});

// ---------------------------------------------------------------------------
// Axios interceptor: attaches Authorization header when token exists
// ---------------------------------------------------------------------------
describe('request interceptor', () => {
  it('attaches Bearer token from cookie when present', async () => {
    const Cookies = await import('js-cookie');
    (Cookies.default.get as jest.Mock).mockReturnValueOnce('my-access-token');

    mock.onGet('/assets').reply(200, []);
    await assetsApi.getAll();

    expect(mock.history.get[0].headers?.Authorization).toBe('Bearer my-access-token');
  });

  it('sends no Authorization header when no token', async () => {
    mock.onGet('/assets').reply(200, []);
    await assetsApi.getAll();

    expect(mock.history.get[0].headers?.Authorization).toBeUndefined();
  });
});
