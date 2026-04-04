'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Asset, ExchangeOrder } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowRightLeft } from 'lucide-react';

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

  useEffect(() => {
    api.get('/assets').then(r => {
      setAssets(r.data);
      if (r.data[0]) setFromAssetId(r.data[0].id);
      if (r.data[1]) setToAssetId(r.data[1].id);
    });
    api.get('/exchange/history').then(r => setHistory(r.data.items || []));
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
      setHistory(r.data.items || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Exchange failed');
    } finally {
      setExecuting(false);
    }
  };

  const fromAsset = assets.find(a => a.id === fromAssetId);
  const toAsset = assets.find(a => a.id === toAssetId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Exchange</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <CardHeader><CardTitle>Exchange History</CardTitle></CardHeader>
            <div className="space-y-2">
              {history.length === 0 ? <p className="text-sm text-gray-500">No exchanges yet</p> : history.slice(0, 10).map(o => (
                <div key={o.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{parseFloat(o.fromAmount).toFixed(4)} → {parseFloat(o.toAmount).toFixed(4)}</p>
                    <p className="text-xs text-gray-500">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'FILLED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
