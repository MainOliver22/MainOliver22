'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Asset, Withdrawal } from '@/types';
import { formatDate } from '@/lib/utils';

export default function WithdrawPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [assetId, setAssetId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [toAddress, setToAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/assets').then(r => { setAssets(r.data); if (r.data[0]) setAssetId(r.data[0].id); });
    api.get('/withdraw/history').then(r => setWithdrawals(r.data.withdrawals || []));
  }, []);

  const handleWithdraw = async () => {
    if (!assetId || !amount) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const body: Record<string, unknown> = { assetId, amount, method };
      if (method === 'CRYPTO' && toAddress) body['toAddress'] = toAddress;
      await api.post('/withdraw/create', body);
      setSuccess('Withdrawal request submitted successfully!');
      const r = await api.get('/withdraw/history');
      setWithdrawals(r.data.withdrawals || []);
      setAmount('');
      setToAddress('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Withdraw Funds</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>New Withdrawal</CardTitle></CardHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={assetId} onChange={e => setAssetId(e.target.value)}>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}
                </select>
              </div>
              <Input label="Amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={method} onChange={e => setMethod(e.target.value)}>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="CRYPTO">Crypto</option>
                </select>
              </div>
              {method === 'CRYPTO' && (
                <Input label="Destination Address" value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x..." />
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}
              <Button onClick={handleWithdraw} loading={loading} className="w-full">Request Withdrawal</Button>
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Withdrawal History</CardTitle></CardHeader>
            <div className="space-y-2">
              {withdrawals.length === 0 ? <p className="text-sm text-gray-500">No withdrawals yet</p> : withdrawals.slice(0, 10).map(w => (
                <div key={w.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{parseFloat(w.amount).toFixed(6)}</p>
                    <p className="text-xs text-gray-500">{formatDate(w.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${w.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : w.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{w.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
