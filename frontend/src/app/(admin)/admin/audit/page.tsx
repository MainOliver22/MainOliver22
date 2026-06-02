'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { Search, Download, Eye, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  actor: string;
  actorEmail: string;
  targetType: string;
  targetId: string;
  targetName: string;
  status: 'SUCCESS' | 'FAILURE';
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState<'ALL' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '25',
        ...(search && { search }),
        ...(action !== 'ALL' && { action }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const response = await api.get(`/admin/audit-logs?${params}`);
      setLogs(response.data.logs || []);
      setTotal(response.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, action, statusFilter]);

  const exportLogs = async () => {
    try {
      const response = await api.get('/admin/audit-logs/export', {
        params: { search, action: action !== 'ALL' ? action : undefined, status: statusFilter !== 'ALL' ? statusFilter : undefined },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-700';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      case 'APPROVE':
        return 'bg-emerald-100 text-emerald-700';
      case 'REJECT':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SUCCESS') {
      return <div className="h-2 w-2 rounded-full bg-green-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <div className="text-sm text-gray-500">Total: {total} events</div>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by user, action, or target..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value as typeof action);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
            </select>
            <Button variant="secondary" onClick={exportLogs} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No audit logs found</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{log.actor}</div>
                      <div className="text-xs text-gray-500">{log.actorEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{log.targetName}</div>
                      <div className="text-xs text-gray-500">{log.targetType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`text-xs font-medium ${log.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}`}>
                          {log.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 px-4 py-3 border-t">
          <Button
            size="sm"
            variant="ghost"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            size="sm"
            variant="ghost"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Audit Log Details</CardTitle>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </CardHeader>
            <div className="px-6 pb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Timestamp</p>
                  <p className="font-medium">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Actor</p>
                  <p className="font-medium">{selectedLog.actor}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Action</p>
                  <p className="font-medium">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className={`font-medium ${selectedLog.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedLog.status}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target Type</p>
                  <p className="font-medium">{selectedLog.targetType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target ID</p>
                  <p className="font-mono text-sm">{selectedLog.targetId}</p>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-xs text-gray-500">Details</p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-xs text-gray-500">IP Address</p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button variant="ghost" className="w-full" onClick={() => setSelectedLog(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
