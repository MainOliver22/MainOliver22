'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { Users, ShieldCheck, CreditCard, Bot, ArrowDownCircle, DollarSign } from 'lucide-react';

interface DashStats {
  totalUsers: number; activeUsers: number; pendingKyc: number;
  totalDepositsToday: number; totalWithdrawalsToday: number; activeBots: number; totalAum: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);

  useEffect(() => { api.get('/admin/dashboard').then(r => setStats(r.data)); }, []);

  const cards = stats ? [
    { icon: Users, label: 'Total Users', value: stats.totalUsers, sub: `${stats.activeUsers} active` },
    { icon: ShieldCheck, label: 'KYC Pending', value: stats.pendingKyc, sub: 'awaiting review' },
    { icon: CreditCard, label: "Today's Deposits", value: stats.totalDepositsToday, sub: 'confirmed today' },
    { icon: ArrowDownCircle, label: "Today's Withdrawals", value: stats.totalWithdrawalsToday, sub: 'requested today' },
    { icon: Bot, label: 'Active Bots', value: stats.activeBots, sub: 'running' },
    { icon: DollarSign, label: 'Total AUM', value: `$${parseFloat(stats.totalAum || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'across all accounts' },
  ] : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map(({ icon: Icon, label, value, sub }) => (
          <Card key={label}>
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{sub}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
