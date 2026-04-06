'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/common/StatCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import api from '@/lib/api';
import { Asset, ExchangeOrder } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowRightLeft } from 'lucide-react';

const ITEMS_PER_PAGE = 8;

export default function ExchangePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [history, setHistory] = useState<ExchangeOrder[]>([]);
  const [fromAssetId, setFromAssetId] = useState('');
  const [toAssetId, setToAssetId] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [quote, setQuote] = useState<ExchangeOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get('/assets').then(r => {
      setAssets(r.data);
      if (r.data[0]) setFromAssetId(r.data[0].id);
      if (r.data[1]) setToAssetId(r.data[1].id);
    });
    api.get('/exchange/history').then(r => setHistory(r.data.orders || []));
  }, []);

  const getQuote = async () => {
    if (!fromAssetId || !toAssetId || !fromAmount) return;
    setLoading(true); setError(''); setQuote(null);
    try {
      const res = await api.post('/exchange/quote', { fromAssetId, toAssetId, fromAmount });
      setQuote(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const executeExchange = async () => {
    if (!quote) return;
    setExecuting(true); setError('');
    try {
      await api.post('/exchange/execute', { quoteId: quote.id });
      setQuote(null); setFromAmount('');
      const r = await api.get('/exchange/history');
      setHistory(r.data.orders || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Exchange failed');
    } finally {
      setExecuting(false);
    }
  };

  const fromAsset = assets.find(a => a.id === fromAssetId);
  const toAsset = assets.find(a => a.id === toAssetId);

  const totalPages = Math.max(1, Math.ceil(history.length / ITEMS_PER_PAGE));
  const pageData = history.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const historyColumns: Column<ExchangeOrder>[] = [
    {
      key: 'fromAmount', header: 'From → To',
      render: row => {
        const from = assets.find(a => a.id === row.fromAssetId);
        const to = assets.find(a => a.id === row.toAssetId);
        return `${parseFloat(row.fromAmount).toFixed(4)} ${from?.symbol ?? ''} → ${parseFloat(row.toAmount).toFixed(4)} ${to?.symbol ?? ''}`;
      },
    },
    { key: 'rate', header: 'Rate', render: row => parseFloat(row.rate).toFixed(6) },
    {
      key: 'status', header: 'Status', render: row => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === 'FILLED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {row.status}
        </span>
      ),
    },
    { key: 'createdAt', header: 'Date', render: row => formatDate(row.createdAt) },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Exchange</h1>

        {/* Price tickers */}
        {assets.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {assets.slice(0, 4).map(a => (
              <StatCard
                key={a.id}
                title={a.symbol}
                value={a.type === 'FIAT' ? '$1.00' : '—'}
                subtitle={a.name}
              />
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Swap Assets</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2" value={fromAssetId} onChange={e => setFromAssetId(e.target.value)}>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.symbol}</option>)}
                </select>
                <Input placeholder="Amount" type="number" value={fromAmount} onChange={e => setFromAmount(e.target.value)} />
              </div>
              <div className="flex justify-center"><ArrowRightLeft className="h-5 w-5 text-gray-400" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={toAssetId} onChange={e => setToAssetId(e.target.value)}>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.symbol}</option>)}
                </select>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {!quote ? (
                <Button onClick={getQuote} loading={loading} className="w-full">Get Quote</Button>
              ) : (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Rate</span><span>{parseFloat(quote.rate).toFixed(6)} {toAsset?.symbol}/{fromAsset?.symbol}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">You receive</span><span className="font-bold">{parseFloat(quote.toAmount).toFixed(6)} {toAsset?.symbol}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">Fee</span><span>{parseFloat(quote.fee).toFixed(6)} {fromAsset?.symbol}</span></div>
                  <div className="flex gap-2 mt-3">
                    <Button onClick={executeExchange} loading={executing} className="flex-1">Execute</Button>
                    <Button onClick={() => setQuote(null)} variant="ghost" className="flex-1">Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>How It Works</CardTitle></CardHeader>
            <div className="text-sm text-gray-500 space-y-2">
              <p>1. Select the asset you want to exchange from and to.</p>
              <p>2. Enter the amount and click <strong>Get Quote</strong>.</p>
              <p>3. Review the rate and fees, then click <strong>Execute</strong>.</p>
              <p className="text-xs text-gray-400 pt-2">Quotes are valid for 30 seconds. Exchange rates are updated in real time.</p>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-3">Exchange History</h2>
          <DataTable
            columns={historyColumns}
            data={pageData}
            keyExtractor={row => row.id}
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage(p => Math.max(1, p - 1))}
            onNext={() => setPage(p => Math.min(totalPages, p + 1))}
            emptyMessage="No exchanges yet"
          />
        </div>
      </main>
    </div>
  );
}
