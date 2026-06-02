'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { Users, ShieldCheck, CreditCard, Bot, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashStats {
  totalUsers: number;
  activeUsers: number;
  pendingKyc: number;
  totalDepositsToday: number;
  totalWithdrawalsToday: number;
  activeBots: number;
  weeklyActivity?: Array<{ date: string; deposits: number; withdrawals: number }>;
  recentActivity?: Array<{ id: string; user: string; action: string; timestamp: string }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((r) => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { icon: Users, label: 'Total Users', value: stats.totalUsers, sub: `${stats.activeUsers} active`, color: 'blue' },
        { icon: ShieldCheck, label: 'KYC Pending', value: stats.pendingKyc, sub: 'awaiting review', color: 'orange' },
        { icon: CreditCard, label: "Today's Deposits", value: `$${(stats.totalDepositsToday || 0).toFixed(2)}`, sub: 'inflow', color: 'green' },
        { icon: Bot, label: 'Active Bots', value: stats.activeBots, sub: 'running', color: 'purple' },
      ]
    : [];

  const colorMap = {
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-lg ${colorMap[color as keyof typeof colorMap]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">{label}</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      {stats?.weeklyActivity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Activity Chart */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="deposits" stroke="#10b981" name="Deposits" />
                <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" name="Withdrawals" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Deposit vs Withdrawal Comparison */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-green-600" />
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="deposits" fill="#10b981" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Recent Activity Feed */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {stats.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                  <p className="text-xs text-gray-500">{activity.action}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(activity.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
        </div>
      )}
    </div>
  );
}
