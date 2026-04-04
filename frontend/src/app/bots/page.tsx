'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { BotStrategy, BotInstance } from '@/types';
import { formatDate } from '@/lib/utils';
import { TrendingUp, TrendingDown, Pause, Square } from 'lucide-react';

export default function BotsPage() {
  const [strategies, setStrategies] = useState<BotStrategy[]>([]);
  const [instances, setInstances] = useState<BotInstance[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<BotStrategy | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    api.get('/bots/strategies').then(r => setStrategies(r.data || []));
    api.get('/bots/instances').then(r => setInstances(r.data || []));
  };

  useEffect(() => { fetchData(); }, []);

  const startBot = async () => {
    if (!selectedStrategy || !allocatedAmount) return;
    setLoading(true); setError('');
    try {
      await api.post('/bots/create-instance', { strategyId: selectedStrategy.id, allocatedAmount });
      fetchData(); setSelectedStrategy(null); setAllocatedAmount('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to start bot');
    } finally {
      setLoading(false);
    }
  };

  const pauseBot = async (id: string) => {
    await api.patch(`/bots/instances/${id}/pause`);
    fetchData();
  };

  const stopBot = async (id: string) => {
    await api.patch(`/bots/instances/${id}/stop`);
    fetchData();
  };

  const riskColors: Record<string, string> = { LOW: 'text-green-600 bg-green-100', MEDIUM: 'text-yellow-600 bg-yellow-100', HIGH: 'text-orange-600 bg-orange-100', AGGRESSIVE: 'text-red-600 bg-red-100' };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Bot Trading</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {strategies.map(s => (
            <Card key={s.id} className={`cursor-pointer transition-all ${selectedStrategy?.id === s.id ? 'ring-2 ring-blue-600' : ''}`} onClick={() => setSelectedStrategy(s)}>
              <CardHeader>
                <CardTitle>{s.name}</CardTitle>
                <span className={`text-xs px-2 py-0.5 rounded-full ${riskColors[s.riskLevel] || ''}`}>{s.riskLevel}</span>
              </CardHeader>
              <p className="text-sm text-gray-600 mb-2">{s.description}</p>
              <p className="text-xs text-gray-500">Max Drawdown: {parseFloat(s.maxDrawdownPercent).toFixed(1)}%</p>
            </Card>
          ))}
          {strategies.length === 0 && <p className="text-sm text-gray-500 col-span-3">No strategies available. Contact admin.</p>}
        </div>
        {selectedStrategy && (
          <Card className="mb-8">
            <CardHeader><CardTitle>Start Bot: {selectedStrategy.name}</CardTitle></CardHeader>
            <div className="flex gap-4 items-end">
              <div className="flex-1"><Input label="Allocation Amount (USD)" type="number" value={allocatedAmount} onChange={e => setAllocatedAmount(e.target.value)} placeholder="100" /></div>
              <Button onClick={startBot} loading={loading}>Start Bot</Button>
              <Button variant="ghost" onClick={() => setSelectedStrategy(null)}>Cancel</Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>My Running Bots</CardTitle></CardHeader>
          {instances.length === 0 ? <p className="text-sm text-gray-500">No bots running. Select a strategy above to start.</p> : (
            <div className="space-y-3">
              {instances.map(inst => (
                <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold">{inst.strategy?.name || 'Bot'}</p>
                    <p className="text-xs text-gray-500">Allocated: ${parseFloat(inst.allocatedAmount).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{formatDate(inst.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {parseFloat(inst.pnl) >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className={`text-sm font-bold ${parseFloat(inst.pnl) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(inst.pnl) >= 0 ? '+' : ''}{parseFloat(inst.pnl).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{inst.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {inst.status === 'ACTIVE' && <Button variant="secondary" size="sm" onClick={() => pauseBot(inst.id)}><Pause className="h-3 w-3" /></Button>}
                    <Button variant="danger" size="sm" onClick={() => stopBot(inst.id)}><Square className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
