'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { BotInstance } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminBotsPage() {
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchInstances = (p: number) => {
    api.get(`/admin/bots/instances?page=${p}&limit=20`).then(r => {
      setInstances(r.data.items || []);
      setTotal(r.data.total || 0);
    });
  };

  useEffect(() => { fetchInstances(page); }, [page]);

  const killAll = async () => {
    if (!confirm('Pause ALL active bots? This cannot be undone.')) return;
    await api.post('/admin/bots/kill-switch');
    fetchInstances(page);
  };

  const statusColor = (status: string) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-700';
    if (status === 'STOPPED') return 'bg-red-100 text-red-700';
    if (status === 'PAUSED') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bot Instances ({total})</h1>
        <Button variant="danger" size="sm" onClick={killAll}>Kill Switch — Pause All</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-3 pr-4">Strategy</th>
              <th className="pb-3 pr-4">Allocated</th>
              <th className="pb-3 pr-4">Current Value</th>
              <th className="pb-3 pr-4">P&L</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Started</th>
            </tr></thead>
            <tbody>
              {instances.map(inst => (
                <tr key={inst.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium">{inst.strategy?.name || inst.strategyId.slice(0, 8)}</td>
                  <td className="py-2 pr-4">${parseFloat(inst.allocatedAmount).toFixed(2)}</td>
                  <td className="py-2 pr-4">${parseFloat(inst.currentValue).toFixed(2)}</td>
                  <td className={`py-2 pr-4 font-semibold ${parseFloat(inst.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {parseFloat(inst.pnl) >= 0 ? '+' : ''}{parseFloat(inst.pnl).toFixed(2)}
                  </td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(inst.status)}`}>{inst.status}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{formatDate(inst.createdAt)}</td>
                </tr>
              ))}
              {instances.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">No bot instances</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4 items-center">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button size="sm" variant="ghost" disabled={instances.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
