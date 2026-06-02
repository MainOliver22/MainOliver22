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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <div className="text-sm text-gray-500">Total: {deposits.length + withdrawals.length} transactions</div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('deposits')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            tab === 'deposits'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Deposits {deposits.length > 0 && `(${deposits.length})`}
        </button>
        <button
          onClick={() => setTab('withdrawals')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            tab === 'withdrawals'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          Withdrawals {withdrawals.length > 0 && `(${withdrawals.length})`}
        </button>
      </div>

      {tab === 'deposits' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No deposits found
                    </td>
                  </tr>
                ) : (
                  deposits.map(d => (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {d.user ? `${d.user.firstName} ${d.user.lastName}` : '—'}
                        </div>
                        <div className="text-xs text-gray-500">{d.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{d.asset?.symbol ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-gray-900">{parseFloat(d.amount).toFixed(6)}</td>
                      <td className="px-4 py-3 text-gray-600">{d.method}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${depositStatusCls(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(d.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'withdrawals' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b bg-gray-50">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Asset</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No withdrawals found
                    </td>
                  </tr>
                ) : (
                  withdrawals.map(w => (
                    <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {w.user ? `${w.user.firstName} ${w.user.lastName}` : '—'}
                        </div>
                        <div className="text-xs text-gray-500">{w.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{w.asset?.symbol ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-gray-900">{parseFloat(w.amount).toFixed(6)}</td>
                      <td className="px-4 py-3 text-gray-600">{w.method}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${withdrawalStatusCls(w.status)}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(w.createdAt)}</td>
                      <td className="px-4 py-3">
                        {w.status === 'PENDING' && !rejecting && rejecting !== w.id && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => approveWithdrawal(w.id)}>Approve</Button>
                            <Button size="sm" variant="danger" onClick={() => setRejecting(w.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {rejecting === w.id && (
                          <div className="space-y-2">
                            <textarea
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                              placeholder="Rejection reason..."
                              value={reason}
                              onChange={e => setReason(e.target.value)}
                              rows={1}
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => rejectWithdrawal(w.id)}
                              >
                                Confirm
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        {w.status !== 'PENDING' && <span className="text-xs text-gray-500">—</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
