import { NextResponse } from 'next/server';

// Temporary preview-only mock API — returns static fixture data so the UI
// can be screenshotted without a running backend.
const DB: Record<string, unknown> = {
  'auth/me': {
    id: '1', email: 'demo@invest.com', firstName: 'Alex', lastName: 'Demo',
    role: 'USER', status: 'ACTIVE',
  },
  'portfolio/balances': {
    balances: [
      { assetId: 'btc', balance: '0.45230000', type: 'CRYPTO', asset: { symbol: 'BTC' } },
      { assetId: 'eth', balance: '3.12000000', type: 'CRYPTO', asset: { symbol: 'ETH' } },
      { assetId: 'usd', balance: '12500.00',   type: 'FIAT',   asset: { symbol: 'USD' } },
    ],
  },
  'bots/instances': {
    instances: [
      { id: '1', status: 'RUNNING', allocatedAmount: '5000', pnl: '342.50',
        strategy: { name: 'Momentum Alpha' } },
      { id: '2', status: 'PAUSED',  allocatedAmount: '2000', pnl: '-45.20',
        strategy: { name: 'Grid BTC/USD' } },
    ],
  },
  'kyc/status': { id: '1', status: 'APPROVED', level: 'BASIC' },
  'portfolio/ledger': {
    entries: [
      { id: '1', type: 'DEPOSIT',    amount: '5000', asset: { symbol: 'USD' }, description: 'Bank wire',       createdAt: '2026-04-01T10:00:00Z' },
      { id: '2', type: 'TRADE',      amount: '0.45', asset: { symbol: 'BTC' }, description: 'Exchange order',  createdAt: '2026-04-02T14:00:00Z' },
      { id: '3', type: 'WITHDRAWAL', amount: '500',  asset: { symbol: 'USD' }, description: 'Wire withdrawal', createdAt: '2026-04-05T09:00:00Z' },
    ],
  },
  'notifications': {
    notifications: [
      { id: '1', type: 'INFO',    message: 'Your KYC has been approved',  read: false, createdAt: '2026-04-06T08:00:00Z' },
      { id: '2', type: 'SUCCESS', message: 'Deposit of $5,000 confirmed', read: true,  createdAt: '2026-04-05T10:00:00Z' },
      { id: '3', type: 'WARNING', message: 'Bot Grid BTC/USD was paused', read: false, createdAt: '2026-04-04T16:00:00Z' },
    ],
  },
  'assets': [
    { id: 'btc', symbol: 'BTC', name: 'Bitcoin',   type: 'CRYPTO' },
    { id: 'eth', symbol: 'ETH', name: 'Ethereum',  type: 'CRYPTO' },
    { id: 'usd', symbol: 'USD', name: 'US Dollar', type: 'FIAT'   },
    { id: 'sol', symbol: 'SOL', name: 'Solana',    type: 'CRYPTO' },
  ],
  'exchange/history': {
    orders: [
      { id: '1', fromAsset: { symbol: 'USD' }, toAsset: { symbol: 'BTC' },
        fromAmount: '1000', toAmount: '0.0452', status: 'COMPLETED', createdAt: '2026-04-02T14:00:00Z' },
    ],
  },
  'deposit/history': {
    deposits: [
      { id: '1', amount: '5000', method: 'WIRE', status: 'COMPLETED',
        asset: { symbol: 'USD' }, createdAt: '2026-04-01T10:00:00Z' },
    ],
  },
  'withdraw/history': {
    withdrawals: [
      { id: '1', amount: '500', method: 'WIRE', status: 'COMPLETED',
        asset: { symbol: 'USD' }, createdAt: '2026-04-05T09:00:00Z' },
    ],
  },
  'bots/strategies': {
    strategies: [
      { id: 's1', name: 'Momentum Alpha', description: 'Trend-following using RSI + MACD',     riskLevel: 'MEDIUM', minAllocation: '100' },
      { id: 's2', name: 'Grid BTC/USD',  description: 'Automated grid trading between levels', riskLevel: 'LOW',    minAllocation: '50'  },
      { id: 's3', name: 'DCA Bot',       description: 'Dollar-cost averaging into Bitcoin',    riskLevel: 'LOW',    minAllocation: '25'  },
    ],
  },
};

async function handler(paramsPromise: Promise<{ path: string[] }>) {
  const params = await paramsPromise;
  const key = params.path.join('/');
  const data = DB[key] ?? { message: 'ok' };
  return NextResponse.json(data, {
    status: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export const GET    = (_req: Request, { params }: { params: Promise<{ path: string[] }> }) => handler(params);
export const POST   = (_req: Request, { params }: { params: Promise<{ path: string[] }> }) => handler(params);
export const PATCH  = (_req: Request, { params }: { params: Promise<{ path: string[] }> }) => handler(params);
export const OPTIONS = () => new NextResponse(null, {
  status: 204,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  },
});
