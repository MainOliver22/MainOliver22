'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface LedgerEntry {
  id: string;
  type: string;
  amount: string;
  asset?: { symbol: string };
  description?: string;
  createdAt: string;
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/portfolio/ledger').then(r => setEntries(r.data.entries || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Transaction Ledger</h1>
        <Card>
          <CardHeader><CardTitle>All Transactions</CardTitle></CardHeader>
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No transactions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Asset</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => (
                    <tr key={e.id} className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(e.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{e.type}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{e.asset?.symbol ?? '—'}</td>
                      <td className="py-3 pr-4 font-medium">{parseFloat(e.amount).toFixed(6)}</td>
                      <td className="py-3 text-gray-500 text-xs">{e.description ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
