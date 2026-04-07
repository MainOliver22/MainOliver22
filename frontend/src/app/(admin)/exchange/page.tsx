'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { assetsApi, exchangeApi } from '@/lib/api';
import { Asset, ExchangeOrder } from '@/types';
import { formatDate } from '@/lib/utils';
import { ArrowRightLeft } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'FILLED'
      ? 'bg-green-100 text-green-700'
      : status === 'PENDING'
      ? 'bg-yellow-100 text-yellow-700'
      : status === 'CANCELLED'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
  );
}

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
  const [success, setSuccess] = useState('');

  const refreshHistory = () =>
    exchangeApi.getHistory().then(setHistory).catch(() => {});

  useEffect(() => {
    assetsApi.getAll().then(data => {
      setAssets(data);
      if (data[0]) setFromAssetId(data[0].id);
      if (data[1]) setToAssetId(data[1].id);
    }).catch(() => {});
    refreshHistory();
  }, []);

  const handleGetQuote = async () => {
    if (!fromAssetId || !toAssetId || !fromAmount) return;
    if (fromAssetId === toAssetId) { setError('From and To assets must differ'); return; }
    setLoading(true); setError(''); setSuccess(''); setQuote(null);
    try {
      const data = await exchangeApi.getQuote({ fromAssetId, toAssetId, fromAmount });
      setQuote(data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!quote) return;
    setExecuting(true); setError(''); setSuccess('');
    try {
      await exchangeApi.executeTrade(quote.id);
      setQuote(null);
      setFromAmount('');
      setSuccess('Exchange executed successfully');
      await refreshHistory();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Exchange failed');
    } finally {
      setExecuting(false);
    }
  };

  const swapAssets = () => {
    setFromAssetId(toAssetId);
    setToAssetId(fromAssetId);
    setQuote(null);
    setFromAmount('');
  };

  const fromAsset = assets.find(a => a.id === fromAssetId);
  const toAsset = assets.find(a => a.id === toAssetId);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exchange</h1>
        <p className="text-sm text-gray-500 mt-0.5">Swap assets instantly at the best available rate</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Swap form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader><CardTitle>Swap Assets</CardTitle></CardHeader>
            <div className="space-y-4">
              {/* From */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  From
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={fromAssetId}
                  onChange={e => { setFromAssetId(e.target.value); setQuote(null); }}
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Amount to swap"
                  type="number"
                  min="0"
                  value={fromAmount}
                  onChange={e => { setFromAmount(e.target.value); setQuote(null); }}
                />
              </div>

              {/* Swap direction button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={swapAssets}
                  className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                  aria-label="Swap direction"
                >
                  <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                </button>
              </div>

              {/* To */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  To
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={toAssetId}
                  onChange={e => { setToAssetId(e.target.value); setQuote(null); }}
                >
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.symbol} — {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Feedback */}
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{success}</p>}

              {/* Quote preview */}
              {quote && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-semibold text-blue-800 mb-2">Quote preview</p>
                  <div className="flex justify-between">
                    <span className="text-gray-600">You send</span>
                    <span className="font-medium">{parseFloat(quote.fromAmount).toFixed(6)} {fromAsset?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">You receive</span>
                    <span className="font-bold text-blue-900">{parseFloat(quote.toAmount).toFixed(6)} {toAsset?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-mono">{parseFloat(quote.rate).toFixed(6)} {toAsset?.symbol}/{fromAsset?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee</span>
                    <span>{parseFloat(quote.fee).toFixed(6)} {fromAsset?.symbol}</span>
                  </div>
                  {quote.quoteExpiresAt && (
                    <p className="text-xs text-gray-400 pt-1">
                      Expires at {formatDate(quote.quoteExpiresAt)}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleExecute} loading={executing} className="flex-1" size="sm">
                      Confirm Swap
                    </Button>
                    <Button onClick={() => setQuote(null)} variant="ghost" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!quote && (
                <Button
                  onClick={handleGetQuote}
                  loading={loading}
                  className="w-full"
                  disabled={!fromAmount || !fromAssetId || !toAssetId}
                >
                  Get Quote
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Trade history */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trade History</CardTitle>
                <span className="text-xs text-gray-400">{history.length} order{history.length !== 1 ? 's' : ''}</span>
              </div>
            </CardHeader>
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">No trades yet — make your first swap</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2">Pair</th>
                    <th className="text-right pb-2">Sent</th>
                    <th className="text-right pb-2">Received</th>
                    <th className="text-right pb-2">Rate</th>
                    <th className="text-right pb-2">Date</th>
                    <th className="text-right pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(o => {
                    const from = assets.find(a => a.id === o.fromAssetId);
                    const to = assets.find(a => a.id === o.toAssetId);
                    return (
                      <tr key={o.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 font-medium text-gray-800">
                          {from?.symbol ?? '?'} → {to?.symbol ?? '?'}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-700">
                          {parseFloat(o.fromAmount).toFixed(4)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-700">
                          {parseFloat(o.toAmount).toFixed(4)}
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-500 text-xs">
                          {parseFloat(o.rate).toFixed(4)}
                        </td>
                        <td className="py-2.5 text-right text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(o.createdAt)}
                        </td>
                        <td className="py-2.5 text-right">
                          <StatusBadge status={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      </div>
      </div>
      </main>
    </div>
  );
}
