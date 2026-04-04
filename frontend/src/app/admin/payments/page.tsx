'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Deposit, Withdrawal } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminPaymentsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = (p: number) => {
    if (tab === 'deposits') {
      api.get(`/admin/deposits?page=${p}&limit=20`).then(r => { setDeposits(r.data.items || []); setTotal(r.data.total || 0); });
    } else {
      api.get(`/admin/withdrawals?page=${p}&limit=20`).then(r => { setWithdrawals(r.data.items || []); setTotal(r.data.total || 0); });
    }
  };

  useEffect(() => { setPage(1); fetchData(1); }, [tab]);
  useEffect(() => { fetchData(page); }, [page]);

  const statusColor = (status: string) => {
    if (status === 'CONFIRMED' || status === 'COMPLETED') return 'bg-green-100 text-green-700';
    if (status === 'FAILED' || status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const items = tab === 'deposits' ? deposits : withdrawals;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={tab === 'deposits' ? 'primary' : 'ghost'} onClick={() => setTab('deposits')}>Deposits</Button>
        <Button size="sm" variant={tab === 'withdrawals' ? 'primary' : 'ghost'} onClick={() => setTab('withdrawals')}>Withdrawals</Button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-3 pr-4">ID</th>
              <th className="pb-3 pr-4">Amount</th>
              <th className="pb-3 pr-4">Method</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Date</th>
            </tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-mono text-xs text-gray-500">{item.id.slice(0, 8)}...</td>
                  <td className="py-2 pr-4 font-medium">{parseFloat(item.amount).toFixed(6)}</td>
                  <td className="py-2 pr-4 text-gray-600">{item.method}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(item.status)}`}>{item.status}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="py-6 text-center text-gray-500">No {tab} found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4 items-center">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page} · {total} total</span>
          <Button size="sm" variant="ghost" disabled={items.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
