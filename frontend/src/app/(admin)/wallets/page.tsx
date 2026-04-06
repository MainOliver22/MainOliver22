'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Asset, Deposit, Withdrawal } from '@/types';
import { formatDate } from '@/lib/utils';

type Tab = 'deposit' | 'withdraw';

export default function WalletsPage() {
  const [tab, setTab] = useState<Tab>('deposit');

  // Deposit state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [depositAssetId, setDepositAssetId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('BANK_TRANSFER');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState('');
  const [depositError, setDepositError] = useState('');

  // Withdraw state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [withdrawAssetId, setWithdrawAssetId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('BANK_TRANSFER');
  const [toAddress, setToAddress] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    api.get('/assets').then(r => {
      setAssets(r.data);
      if (r.data[0]) { setDepositAssetId(r.data[0].id); setWithdrawAssetId(r.data[0].id); }
    });
    api.get('/deposit/history').then(r => setDeposits(r.data.deposits || []));
    api.get('/withdraw/history').then(r => setWithdrawals(r.data.withdrawals || []));
  }, []);

  const handleDeposit = async () => {
    if (!depositAssetId || !depositAmount) return;
    setDepositLoading(true); setDepositError(''); setDepositSuccess('');
    try {
      await api.post('/deposit/create', { assetId: depositAssetId, amount: depositAmount, method: depositMethod });
      setDepositSuccess('Deposit created successfully!');
      const r = await api.get('/deposit/history');
      setDeposits(r.data.deposits || []);
      setDepositAmount('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDepositError(e?.response?.data?.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAssetId || !withdrawAmount) return;
    setWithdrawLoading(true); setWithdrawError(''); setWithdrawSuccess('');
    try {
      const body: Record<string, unknown> = { assetId: withdrawAssetId, amount: withdrawAmount, method: withdrawMethod };
      if (withdrawMethod === 'CRYPTO' && toAddress) body['toAddress'] = toAddress;
      await api.post('/withdraw/create', body);
      setWithdrawSuccess('Withdrawal request submitted successfully!');
      const r = await api.get('/withdraw/history');
      setWithdrawals(r.data.withdrawals || []);
      setWithdrawAmount('');
      setToAddress('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setWithdrawError(e?.response?.data?.message || 'Withdrawal failed');
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Wallets</h1>
        <div className="flex gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'deposit' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setTab('deposit')}
          >
            Deposit
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'withdraw' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        {tab === 'deposit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>New Deposit</CardTitle></CardHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={depositAssetId} onChange={e => setDepositAssetId(e.target.value)}>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}
                  </select>
                </div>
                <Input label="Amount" type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="0.00" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={depositMethod} onChange={e => setDepositMethod(e.target.value)}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="CRYPTO">Crypto</option>
                    <option value="ONRAMP">Fiat On-Ramp</option>
                  </select>
                </div>
                {depositError && <p className="text-sm text-red-600">{depositError}</p>}
                {depositSuccess && <p className="text-sm text-green-600">{depositSuccess}</p>}
                <Button onClick={handleDeposit} loading={depositLoading} className="w-full">Create Deposit</Button>
              </div>
            </Card>
            <Card>
              <CardHeader><CardTitle>Deposit History</CardTitle></CardHeader>
              <div className="space-y-2">
                {deposits.length === 0 ? <p className="text-sm text-gray-500">No deposits yet</p> : deposits.slice(0, 10).map(d => (
                  <div key={d.id} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{parseFloat(d.amount).toFixed(6)}</p>
                      <p className="text-xs text-gray-500">{formatDate(d.createdAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${d.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'withdraw' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>New Withdrawal</CardTitle></CardHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={withdrawAssetId} onChange={e => setWithdrawAssetId(e.target.value)}>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.symbol})</option>)}
                  </select>
                </div>
                <Input label="Amount" type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0.00" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={withdrawMethod} onChange={e => setWithdrawMethod(e.target.value)}>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="CRYPTO">Crypto</option>
                  </select>
                </div>
                {withdrawMethod === 'CRYPTO' && (
                  <Input label="Destination Address" value={toAddress} onChange={e => setToAddress(e.target.value)} placeholder="0x..." />
                )}
                {withdrawError && <p className="text-sm text-red-600">{withdrawError}</p>}
                {withdrawSuccess && <p className="text-sm text-green-600">{withdrawSuccess}</p>}
                <Button onClick={handleWithdraw} loading={withdrawLoading} className="w-full">Request Withdrawal</Button>
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
        )}
      </main>
    </div>
  );
}
