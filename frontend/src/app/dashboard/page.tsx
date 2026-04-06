'use client';
import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/common/StatCard';
import { Chart, ChartDataPoint } from '@/components/common/Chart';
import { DonutChart, DonutSlice } from '@/components/ui/charts/DonutChart';
import { DataTable, Column } from '@/components/tables/DataTable';
import api from '@/lib/api';
import { Balance, BotInstance } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, Bot, Activity } from 'lucide-react';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

function buildPortfolioChartData(balances: Balance[]): ChartDataPoint[] {
  // Generate last-7-day mock trend based on current balances (real data would come from portfolio history API)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  const total = balances.reduce((s, b) => s + parseFloat(b.balance), 0);
  return days.map((label, i) => ({
    label,
    value: parseFloat(((total * (0.88 + i * 0.02)) || 0).toFixed(2)),
  }));
}

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

  const totalValue = useMemo(
    () => balances.reduce((s, b) => s + parseFloat(b.balance), 0),
    [balances],
  );

  const totalPnl = useMemo(
    () => bots.reduce((sum, b) => sum + parseFloat(b.pnl || '0'), 0),
    [bots],
  );

  const activeBots = bots.filter(b => b.status === 'ACTIVE').length;

  const portfolioChartData = useMemo(() => buildPortfolioChartData(balances), [balances]);

  const allocationData: DonutSlice[] = useMemo(
    () =>
      balances.map((b, i) => ({
        name: b.asset?.symbol ?? b.assetId,
        value: parseFloat(b.balance),
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [balances],
  );

  const botTableColumns: Column<BotInstance>[] = [
    { key: 'strategy', header: 'Strategy', render: row => row.strategy?.name ?? 'Bot' },
    { key: 'allocatedAmount', header: 'Allocated', render: row => `$${parseFloat(row.allocatedAmount).toFixed(2)}` },
    { key: 'status', header: 'Status', render: row => (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
        {row.status}
      </span>
    )},
    { key: 'pnl', header: 'P&L', render: row => (
      <span className={`font-semibold ${parseFloat(row.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {parseFloat(row.pnl) >= 0 ? '+' : ''}{parseFloat(row.pnl).toFixed(2)}
      </span>
    )},
    { key: 'createdAt', header: 'Started', render: row => formatDate(row.createdAt) },
  ];

  if (loading || loadingData) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Dashboard</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Portfolio"
            value={`$${totalValue.toFixed(2)}`}
            subtitle="All assets combined"
            icon={<Wallet className="h-5 w-5" />}
            trend={2.4}
            trendLabel="vs last week"
          />
          <StatCard
            title="Bot P&L"
            value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`}
            subtitle="Realized + unrealized"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={totalPnl}
          />
          <StatCard
            title="Active Bots"
            value={activeBots}
            subtitle={`${bots.length} total instances`}
            icon={<Bot className="h-5 w-5" />}
          />
          <StatCard
            title="Assets"
            value={balances.length}
            subtitle="Across all wallets"
            icon={<Activity className="h-5 w-5" />}
          />
        </div>

        {/* Portfolio chart + Asset allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Chart
            className="lg:col-span-2"
            title="Portfolio Value (7 days)"
            data={portfolioChartData}
            series={[{ key: 'value', name: 'Value (USD)', color: '#3b82f6' }]}
            type="area"
          />
          {allocationData.length > 0 ? (
            <DonutChart
              title="Asset Allocation"
              data={allocationData}
              height={240}
              innerRadius={50}
              outerRadius={85}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-center text-center gap-3">
              <p className="text-sm font-semibold text-gray-700">Asset Allocation</p>
              <p className="text-sm text-gray-400">No balances yet</p>
              <Link href="/deposit"><Button size="sm">Deposit Funds</Button></Link>
            </div>
          )}
        </div>

        {/* Bot instances table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800">Bot Instances</h2>
            <Link href="/bots"><Button size="sm" variant="secondary">Manage Bots</Button></Link>
          </div>
          <DataTable
            columns={botTableColumns}
            data={bots}
            keyExtractor={row => row.id}
            emptyMessage="No bots running. Head to Bot Trading to get started."
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/deposit"><Button className="w-full" size="sm">Deposit</Button></Link>
          <Link href="/withdraw"><Button className="w-full" size="sm" variant="secondary">Withdraw</Button></Link>
          <Link href="/exchange"><Button className="w-full" size="sm" variant="secondary">Exchange</Button></Link>
          <Link href="/kyc"><Button className="w-full" size="sm" variant="ghost">KYC Verification</Button></Link>
        </div>
      </main>
    </div>
  );
}
