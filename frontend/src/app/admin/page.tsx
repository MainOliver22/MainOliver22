'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, ShieldCheck, CreditCard, Bot } from 'lucide-react';
import CardDataStats from '@/components/admin/CardDataStats';
import ChartRevenue, { type ChartRevenueDataPoint } from '@/components/admin/Charts/ChartRevenue';

interface DashStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalDepositsToday: number;
  totalWithdrawalsToday: number;
  activeBots: number;
}

const CHART_DATA: ChartRevenueDataPoint[] = [
  { label: 'Mon', deposits: 4500, withdrawals: 2100 },
  { label: 'Tue', deposits: 3800, withdrawals: 1800 },
  { label: 'Wed', deposits: 6200, withdrawals: 2900 },
  { label: 'Thu', deposits: 5100, withdrawals: 2400 },
  { label: 'Fri', deposits: 7300, withdrawals: 3200 },
  { label: 'Sat', deposits: 4200, withdrawals: 1900 },
  { label: 'Sun', deposits: 3600, withdrawals: 1700 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2434]">Dashboard</h1>
        <p className="mt-1 text-sm text-[#64748B]">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <CardDataStats
          title="Total Users"
          total={stats?.totalUsers ?? '—'}
          rate={stats ? `${stats.activeUsers} active` : undefined}
          trend="up"
          iconBg="bg-[#3C50E0]"
        >
          <Users className="h-5 w-5 text-white" />
        </CardDataStats>

        <CardDataStats
          title="KYC Pending"
          total={stats?.pendingKyc ?? '—'}
          rate="awaiting review"
          iconBg="bg-[#FFA70B]"
        >
          <ShieldCheck className="h-5 w-5 text-white" />
        </CardDataStats>

        <CardDataStats
          title="Deposits Today"
          total={stats ? `$${(stats.totalDepositsToday || 0).toFixed(2)}` : '—'}
          rate="vs. yesterday"
          trend="up"
          iconBg="bg-[#219653]"
        >
          <CreditCard className="h-5 w-5 text-white" />
        </CardDataStats>

        <CardDataStats
          title="Active Bots"
          total={stats?.activeBots ?? '—'}
          rate="running"
          iconBg="bg-[#6577F3]"
        >
          <Bot className="h-5 w-5 text-white" />
        </CardDataStats>
      </div>

      {/* Revenue Chart — placeholder data until /admin/revenue endpoint is wired */}
      <ChartRevenue data={CHART_DATA} sampleData />
    </div>
  );
}
