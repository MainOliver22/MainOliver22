'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminDeposit {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
  asset?: { symbol: string };
  user?: { email: string; firstName: string; lastName: string };
}

interface AdminWithdrawal {
  id: string;
  amount: string;
  method: string;
  status: string;
  createdAt: string;
  asset?: { symbol: string };
  user?: { email: string; firstName: string; lastName: string };
}

type Tab = 'deposits' | 'withdrawals';

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<Tab>('deposits');
  const [deposits, setDeposits] = useState<AdminDeposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const fetchDeposits = () => {
    api.get('/admin/deposits?page=1&limit=50').then(r => setDeposits(r.data.deposits || []));
  };

  const fetchWithdrawals = () => {
    api.get('/admin/withdrawals?page=1&limit=50').then(r => setWithdrawals(r.data.withdrawals || []));
  };

  useEffect(() => {
    fetchDeposits();
    fetchWithdrawals();
  }, []);

  const approveWithdrawal = async (id: string) => {
    await api.patch(`/admin/withdrawals/${id}/approve`);
    fetchWithdrawals();
  };

  const rejectWithdrawal = async (id: string) => {
    await api.patch(`/admin/withdrawals/${id}/reject`, { reason });
    setRejecting(null);
    setReason('');
    fetchWithdrawals();
  };

  const depositStatusCls = (status: string) =>
    status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
    status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-600';

  const withdrawalStatusCls = (status: string) =>
    status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
    status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
    status === 'REJECTED' ? 'bg-red-100 text-red-700' :
    'bg-gray-100 text-gray-600';

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'deposits' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          onClick={() => setTab('deposits')}
        >
          Deposits ({deposits.length})
        </button>
        <button
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'withdrawals' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          onClick={() => setTab('withdrawals')}
        >
          Withdrawals ({withdrawals.length})
        </button>
      </div>

      {tab === 'deposits' && (
        <Card>
          <CardHeader><CardTitle>All Deposits</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Asset</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map(d => (
                  <tr key={d.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600 text-xs">
                      {d.user ? `${d.user.firstName} ${d.user.lastName}` : '—'}<br />
                      <span className="text-gray-400">{d.user?.email}</span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{d.asset?.symbol ?? '—'}</td>
                    <td className="py-3 pr-4 font-mono">{parseFloat(d.amount).toFixed(6)}</td>
                    <td className="py-3 pr-4 text-gray-500">{d.method}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${depositStatusCls(d.status)}`}>{d.status}</span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">{formatDate(d.createdAt)}</td>
                  </tr>
                ))}
                {deposits.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-gray-500">No deposits</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'withdrawals' && (
        <Card>
          <CardHeader><CardTitle>All Withdrawals</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3 pr-4">Asset</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Method</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map(w => (
                  <tr key={w.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 text-gray-600 text-xs">
                      {w.user ? `${w.user.firstName} ${w.user.lastName}` : '—'}<br />
                      <span className="text-gray-400">{w.user?.email}</span>
                    </td>
                    <td className="py-3 pr-4 font-medium">{w.asset?.symbol ?? '—'}</td>
                    <td className="py-3 pr-4 font-mono">{parseFloat(w.amount).toFixed(6)}</td>
                    <td className="py-3 pr-4 text-gray-500">{w.method}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${withdrawalStatusCls(w.status)}`}>{w.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(w.createdAt)}</td>
                    <td className="py-3">
                      {w.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => approveWithdrawal(w.id)}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => setRejecting(w.id)}>Reject</Button>
                        </div>
                      )}
                      {rejecting === w.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            className="border rounded px-2 py-1 text-xs flex-1"
                            placeholder="Rejection reason"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                          />
                          <Button size="sm" variant="danger" onClick={() => rejectWithdrawal(w.id)}>Confirm</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-gray-500">No withdrawals</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
