'use client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Search } from 'lucide-react';

interface AuditLog {
  id: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');

  const fetchLogs = () => {
    api
      .get('/admin/audit-logs', {
        params: {
          action,
          page: 1,
          limit: 50,
        },
      })
      .then(r => setLogs(r.data.logs || []));
  };
  useEffect(() => { fetchLogs(); }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2434]">Audit Logs</h1>
        <p className="mt-1 text-sm text-[#64748B]">Immutable record of all privileged actions</p>
      </div>

      {/* Search bar */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
          <Input
            aria-label="Filter by action"
            className="pl-9"
            placeholder="Filter by action…"
            value={action}
            onChange={e => setAction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchLogs()}
          />
        </div>
        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-lg bg-[#3C50E0] px-4 py-2 text-sm font-medium text-white hover:bg-[#3346D3] transition-colors"
        >
          Search
        </button>
      </div>

      <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Actor Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Action</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-6 py-3 text-xs text-[#64748B]">{formatDate(l.createdAt)}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {l.actorRole}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <code className="rounded bg-[#F7F9FC] px-1.5 py-0.5 text-xs font-mono text-[#1C2434]">
                      {l.action}
                    </code>
                  </td>
                  <td className="px-6 py-3 text-xs text-[#64748B]">
                    {l.targetType}
                    {l.targetId && (
                      <span className="ml-1 font-mono">({l.targetId.slice(0, 8)}…)</span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-[#64748B]">
                    {l.ipAddress || '—'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-[#64748B]">
                    No audit logs found
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
