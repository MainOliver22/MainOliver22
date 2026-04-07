'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface KycCaseAdmin {
  id: string; status: string; level: string; user?: { email: string; firstName: string; lastName: string; };
  submittedAt?: string; createdAt: string;
}

export default function AdminKycPage() {
  const [cases, setCases] = useState<KycCaseAdmin[]>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const fetchCases = () => { api.get('/admin/kyc?page=1&limit=50').then(r => setCases(r.data.cases || [])); };
  useEffect(() => { fetchCases(); }, []);

  const approve = async (id: string) => { await api.patch(`/admin/kyc/${id}/approve`); fetchCases(); };
  const reject = async (id: string) => { await api.patch(`/admin/kyc/${id}/reject`, { reason }); setRejecting(null); setReason(''); fetchCases(); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">KYC Queue</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b">
              <th className="pb-3 pr-4">User</th><th className="pb-3 pr-4">Level</th>
              <th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Submitted</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4">{c.user ? `${c.user.firstName} ${c.user.lastName} (${c.user.email})` : c.id}</td>
                  <td className="py-3 pr-4">{c.level}</td>
                  <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${c.status === 'APPROVED' ? 'bg-green-100 text-green-700' : c.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span></td>
                  <td className="py-3 pr-4 text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="py-3">
                    {(c.status === 'PENDING' || c.status === 'IN_REVIEW') && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approve(c.id)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => setRejecting(c.id)}>Reject</Button>
                      </div>
                    )}
                    {rejecting === c.id && (
                      <div className="mt-2 flex gap-2">
                        <input className="border rounded px-2 py-1 text-xs flex-1" placeholder="Rejection reason" value={reason} onChange={e => setReason(e.target.value)} />
                        <Button size="sm" variant="danger" onClick={() => reject(c.id)}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-gray-500">No KYC cases</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
