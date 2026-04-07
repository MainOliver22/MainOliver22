'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminOrder {
  id: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  fee: string;
  status: string;
  createdAt: string;
  fromAsset?: { symbol: string };
  toAsset?: { symbol: string };
  user?: { email: string; firstName: string; lastName: string };
}

const STATUS_CLS: Record<string, string> = {
  FILLED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminExchangePage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/admin/exchange/orders?page=1&limit=50').then(r => {
      setOrders(r.data.orders || []);
      setTotal(r.data.total || 0);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exchange Orders ({total})</h1>
      <Card>
        <CardHeader><CardTitle>All Exchange Orders</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 pr-4">Pair</th>
                <th className="pb-3 pr-4">Sent</th>
                <th className="pb-3 pr-4">Received</th>
                <th className="pb-3 pr-4">Rate</th>
                <th className="pb-3 pr-4">Fee</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 text-gray-600 text-xs">
                    {o.user ? `${o.user.firstName} ${o.user.lastName}` : '—'}<br />
                    <span className="text-gray-400">{o.user?.email}</span>
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {o.fromAsset?.symbol ?? '?'} → {o.toAsset?.symbol ?? '?'}
                  </td>
                  <td className="py-3 pr-4 font-mono">{parseFloat(o.fromAmount).toFixed(4)}</td>
                  <td className="py-3 pr-4 font-mono">{parseFloat(o.toAmount).toFixed(4)}</td>
                  <td className="py-3 pr-4 font-mono text-gray-500 text-xs">{parseFloat(o.rate).toFixed(6)}</td>
                  <td className="py-3 pr-4 font-mono text-gray-500 text-xs">{parseFloat(o.fee).toFixed(6)}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_CLS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500 text-xs whitespace-nowrap">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={8} className="py-6 text-center text-gray-500">No exchange orders</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
