'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AuditLog { id: string; actorRole: string; action: string; targetType: string; targetId?: string; details: Record<string, unknown>; ipAddress?: string; createdAt: string; }

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [action, setAction] = useState('');

  const fetchLogs = () => { api.get(`/admin/audit-logs?action=${action}&page=1&limit=50`).then(r => setLogs(r.data.logs || [])); };
  useEffect(() => { fetchLogs(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Audit Logs</h1>
      <div className="mb-4 flex gap-3">
        <Input placeholder="Filter by action..." value={action} onChange={e => setAction(e.target.value)} />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm" onClick={fetchLogs}>Search</button>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b">
              <th className="pb-3 pr-4">Time</th><th className="pb-3 pr-4">Actor Role</th>
              <th className="pb-3 pr-4">Action</th><th className="pb-3 pr-4">Target</th><th className="pb-3">IP</th>
            </tr></thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b">
                  <td className="py-2 pr-4 text-slate-500 text-xs">{formatDate(l.createdAt)}</td>
                  <td className="py-2 pr-4">{l.actorRole}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{l.action}</td>
                  <td className="py-2 pr-4 text-slate-500 text-xs">{l.targetType} {l.targetId ? `(${l.targetId.slice(0,8)}...)` : ''}</td>
                  <td className="py-2 text-slate-500 text-xs">{l.ipAddress || '-'}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">No audit logs</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
