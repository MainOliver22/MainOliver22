'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Balance, BotInstance } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/portfolio/balances').then(r => setBalances(r.data.balances || [])),
      api.get('/bots/instances').then(r => setBots(r.data.instances || [])),
    ]).finally(() => setLoadingData(false));
  }, [user]);

  if (loading || loadingData) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  const totalPnl = bots.reduce((sum, b) => sum + parseFloat(b.pnl || '0'), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader><CardTitle>Total Balances</CardTitle></CardHeader>
            <div className="space-y-2">
              {balances.length === 0 ? <p className="text-sm text-gray-500">No balances yet</p> : balances.map(b => (
                <div key={b.assetId} className="flex justify-between">
                  <span className="text-sm text-gray-600">{b.asset?.symbol}</span>
                  <span className="text-sm font-medium">{parseFloat(b.balance).toFixed(6)}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Bot P&L</CardTitle></CardHeader>
            <p className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USD
            </p>
            <p className="text-sm text-gray-500 mt-1">{bots.length} active bot{bots.length !== 1 ? 's' : ''}</p>
          </Card>
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <div className="space-y-2">
              <Link href="/wallets"><Button className="w-full" size="sm">Deposit Funds</Button></Link>
              <Link href="/wallets"><Button className="w-full" size="sm" variant="secondary">Withdraw</Button></Link>
              <Link href="/exchange"><Button className="w-full" size="sm" variant="secondary">Exchange</Button></Link>
              <Link href="/bots"><Button className="w-full" size="sm" variant="ghost">Bot Trading</Button></Link>
            </div>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Active Bots</CardTitle></CardHeader>
            {bots.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">No bots running</p>
                <Link href="/bots"><Button size="sm">Start a Bot</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bots.slice(0, 3).map(bot => (
                  <div key={bot.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{bot.strategy?.name || 'Bot'}</p>
                      <p className="text-xs text-gray-500">${parseFloat(bot.allocatedAmount).toFixed(2)} allocated</p>
                    </div>
                    <span className={`text-sm font-semibold ${parseFloat(bot.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(bot.pnl) >= 0 ? '+' : ''}{parseFloat(bot.pnl).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <CardHeader><CardTitle>KYC Status</CardTitle></CardHeader>
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">Complete KYC to unlock all features</p>
              <Link href="/kyc"><Button size="sm" variant="secondary">Start Verification</Button></Link>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
