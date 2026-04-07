'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { walletApi, botsApi, kycApi } from '@/lib/api';
import { Balance, BotInstance, KycCase } from '@/types';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'green' | 'red' | 'blue' | 'default';
}) {
  const accentClass =
    accent === 'green'
      ? 'text-green-600'
      : accent === 'red'
      ? 'text-red-600'
      : accent === 'blue'
      ? 'text-blue-600'
      : 'text-gray-900';
  return (
    <Card>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [bots, setBots] = useState<BotInstance[]>([]);
  const [kyc, setKyc] = useState<KycCase | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      walletApi.getBalances().then(setBalances).catch(() => {}),
      botsApi.getInstances().then(setBots).catch(() => {}),
      kycApi.getStatus().then(setKyc).catch(() => {}),
    ]).finally(() => setLoadingData(false));
  }, [user]);

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalPnl = bots.reduce((sum, b) => sum + parseFloat(b.pnl || '0'), 0);
  const activeBots = bots.filter(b => b.status === 'RUNNING');
  const kycBadge =
    kyc?.status === 'APPROVED'
      ? { label: 'Verified', cls: 'bg-green-100 text-green-700' }
      : kyc?.status === 'PENDING'
      ? { label: 'Pending Review', cls: 'bg-yellow-100 text-yellow-700' }
      : { label: 'Not Started', cls: 'bg-gray-100 text-gray-600' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.firstName ?? 'Investor'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your portfolio at a glance</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${kycBadge.cls}`}>
          KYC: {kycBadge.label}
        </span>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Portfolio Assets"
          value={String(balances.length)}
          sub={balances.length === 0 ? 'No balances yet' : `${balances.length} asset${balances.length !== 1 ? 's' : ''} held`}
          accent="blue"
        />
        <StatCard
          label="Bot P&L (USD)"
          value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`}
          sub={`${bots.length} bot${bots.length !== 1 ? 's' : ''} total`}
          accent={totalPnl >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Active Bots"
          value={String(activeBots.length)}
          sub="Currently running"
          accent="default"
        />
        <StatCard
          label="KYC Level"
          value={kyc?.level ?? '—'}
          sub={kycBadge.label}
          accent={kyc?.status === 'APPROVED' ? 'green' : 'default'}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio balances */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Portfolio Balances</CardTitle>
                <Link href="/wallets">
                  <Button size="sm" variant="ghost">View all</Button>
                </Link>
              </div>
            </CardHeader>
            {balances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No balances yet — make your first deposit</p>
                <Link href="/wallets"><Button size="sm">Deposit Funds</Button></Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2">Asset</th>
                    <th className="text-left pb-2">Type</th>
                    <th className="text-right pb-2">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map(b => (
                    <tr key={b.assetId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2.5 font-medium text-gray-800">{b.asset?.symbol ?? b.assetId}</td>
                      <td className="py-2.5 text-gray-500">{b.type}</td>
                      <td className="py-2.5 text-right font-mono text-gray-800">
                        {parseFloat(b.balance).toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Active bots */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Bots</CardTitle>
                <Link href="/bots">
                  <Button size="sm" variant="ghost">Manage</Button>
                </Link>
              </div>
            </CardHeader>
            {bots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-3">No bots running — start one to automate trading</p>
                <Link href="/bots"><Button size="sm">Launch a Bot</Button></Link>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2">Strategy</th>
                    <th className="text-left pb-2">Status</th>
                    <th className="text-right pb-2">Allocated</th>
                    <th className="text-right pb-2">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.slice(0, 5).map(bot => {
                    const pnl = parseFloat(bot.pnl || '0');
                    return (
                      <tr key={bot.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-2.5 font-medium text-gray-800">
                          {bot.strategy?.name ?? 'Bot'}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            bot.status === 'RUNNING'
                              ? 'bg-green-100 text-green-700'
                              : bot.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {bot.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-mono text-gray-700">
                          ${parseFloat(bot.allocatedAmount).toFixed(2)}
                        </td>
                        <td className={`py-2.5 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* Quick actions sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <div className="space-y-2">
              <Link href="/wallets" className="block">
                <Button className="w-full" size="sm">Deposit Funds</Button>
              </Link>
              <Link href="/wallets" className="block">
                <Button className="w-full" size="sm" variant="secondary">Withdraw</Button>
              </Link>
              <Link href="/exchange" className="block">
                <Button className="w-full" size="sm" variant="secondary">Exchange</Button>
              </Link>
              <Link href="/bots" className="block">
                <Button className="w-full" size="sm" variant="ghost">Bot Trading</Button>
              </Link>
              <Link href="/ledger" className="block">
                <Button className="w-full" size="sm" variant="ghost">Ledger</Button>
              </Link>
            </div>
          </Card>

          {kyc?.status !== 'APPROVED' && (
            <Card>
              <CardHeader><CardTitle>Complete Verification</CardTitle></CardHeader>
              <p className="text-sm text-gray-500 mb-4">
                Verify your identity to unlock higher limits and all platform features.
              </p>
              <Link href="/kyc" className="block">
                <Button className="w-full" size="sm" variant="secondary">Start KYC</Button>
              </Link>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Account</CardTitle></CardHeader>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800 truncate ml-2">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Role</span>
                <span className="font-medium text-gray-800">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-800">{user?.status}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </div>
      </main>
    </div>
  );
}
