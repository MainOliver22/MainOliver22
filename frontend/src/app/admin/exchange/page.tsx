'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { ExchangeOrder } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AdminExchangePage() {
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get(`/admin/exchange/orders?page=${page}&limit=20`).then(r => {
      setOrders(r.data.items || []);
      setTotal(r.data.total || 0);
    });
  }, [page]);

  const statusColor = (status: string) => {
    if (status === 'FILLED') return 'bg-green-100 text-green-700';
    if (status === 'FAILED' || status === 'CANCELLED') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exchange Orders ({total})</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-3 pr-4">From</th>
              <th className="pb-3 pr-4">To</th>
              <th className="pb-3 pr-4">Rate</th>
              <th className="pb-3 pr-4">Fee</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Date</th>
            </tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-2 pr-4 font-medium">{parseFloat(o.fromAmount).toFixed(4)}</td>
                  <td className="py-2 pr-4">{parseFloat(o.toAmount).toFixed(4)}</td>
                  <td className="py-2 pr-4 text-gray-600">{parseFloat(o.rate).toFixed(6)}</td>
                  <td className="py-2 pr-4 text-gray-600">{parseFloat(o.fee).toFixed(6)}</td>
                  <td className="py-2 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="py-2 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500">No exchange orders</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4 items-center">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <Button size="sm" variant="ghost" disabled={orders.length < 20} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
