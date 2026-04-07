'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminBotInstance {
  id: string;
  allocatedAmount: string;
  currentValue: string;
  pnl: string;
  status: string;
  createdAt: string;
  strategy?: { name: string; riskLevel: string };
  user?: { email: string; firstName: string; lastName: string };
}

const STATUS_CLS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  STOPPED: 'bg-gray-100 text-gray-600',
};

export default function AdminBotsPage() {
  const [instances, setInstances] = useState<AdminBotInstance[]>([]);
  const [total, setTotal] = useState(0);
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);
  const [killSwitchMsg, setKillSwitchMsg] = useState('');

  const fetchInstances = () => {
    api.get('/admin/bots/instances?page=1&limit=50').then(r => {
      setInstances(r.data.instances || []);
      setTotal(r.data.total || 0);
    });
  };

  useEffect(() => { fetchInstances(); }, []);

  const handleKillSwitch = async () => {
    setKillSwitchLoading(true);
    setKillSwitchMsg('');
    try {
      const r = await api.post('/admin/bots/kill-switch');
      setKillSwitchMsg(`Kill switch activated — ${r.data.affected} bot(s) paused.`);
      fetchInstances();
    } catch {
      setKillSwitchMsg('Failed to activate kill switch.');
    } finally {
      setKillSwitchLoading(false);
    }
  };

  const activeCount = instances.filter(i => i.status === 'ACTIVE').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bot Instances ({total})</h1>
        <div className="flex items-center gap-3">
          {killSwitchMsg && (
            <p className="text-sm text-gray-600">{killSwitchMsg}</p>
          )}
          <Button
            variant="danger"
            onClick={handleKillSwitch}
            loading={killSwitchLoading}
            disabled={activeCount === 0}
          >
            Kill Switch ({activeCount} active)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>All Bot Instances</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Strategy</th>
                <th className="pb-3 pr-4">Risk</th>
                <th className="pb-3 pr-4">Allocated</th>
                <th className="pb-3 pr-4">P&amp;L</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {instances.map(inst => {
                const pnl = parseFloat(inst.pnl);
                return (
                  <tr key={inst.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600 text-xs">
                      {inst.user ? `${inst.user.firstName} ${inst.user.lastName}` : '—'}<br />
                      <span className="text-gray-400">{inst.user?.email}</span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{inst.strategy?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{inst.strategy?.riskLevel ?? '—'}</td>
                    <td className="py-3 pr-4 font-mono">${parseFloat(inst.allocatedAmount).toFixed(2)}</td>
                    <td className={`py-3 pr-4 font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[inst.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(inst.createdAt)}</td>
                  </tr>
                );
              })}
              {instances.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-gray-500">No bot instances</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
