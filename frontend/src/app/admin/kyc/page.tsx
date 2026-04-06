'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface KycCaseAdmin {
  id: string;
  status: string;
  level: string;
  user?: { email: string; firstName: string; lastName: string };
  submittedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-[#EBFBF2] text-[#219653]',
  REJECTED: 'bg-[#FEF3F2] text-[#D34053]',
  PENDING: 'bg-[#FFFAEB] text-[#FFA70B]',
  IN_REVIEW: 'bg-blue-50 text-blue-700',
};

export default function AdminKycPage() {
  const [cases, setCases] = useState<KycCaseAdmin[]>([]);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const fetchCases = () => {
    api.get('/admin/kyc?page=1&limit=50').then(r => setCases(r.data.cases || []));
  };
  useEffect(() => { fetchCases(); }, []);

  const approve = async (id: string) => { await api.patch(`/admin/kyc/${id}/approve`); fetchCases(); };
  const reject = async (id: string) => {
    await api.patch(`/admin/kyc/${id}/reject`, { reason });
    setRejecting(null);
    setReason('');
    fetchCases();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2434]">KYC Queue</h1>
        <p className="mt-1 text-sm text-[#64748B]">Review and manage identity verification requests</p>
      </div>

      <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Level</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Submitted</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {cases.map(c => (
                <tr key={c.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1C2434]">
                    {c.user
                      ? `${c.user.firstName} ${c.user.lastName}`
                      : c.id.slice(0, 8) + '...'}
                    {c.user && (
                      <span className="ml-2 text-xs text-[#64748B]">({c.user.email})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">{c.level}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">{formatDate(c.createdAt)}</td>
                  <td className="px-6 py-4">
                    {(c.status === 'PENDING' || c.status === 'IN_REVIEW') && (
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => approve(c.id)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => setRejecting(c.id)}>Reject</Button>
                      </div>
                    )}
                    {rejecting === c.id && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <input
                          className="flex-1 rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs outline-none focus:border-[#3C50E0]"
                          placeholder="Rejection reason…"
                          value={reason}
                          onChange={e => setReason(e.target.value)}
                        />
                        <Button size="sm" variant="danger" onClick={() => reject(c.id)}>Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>Cancel</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#64748B]">
                    No KYC cases found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
