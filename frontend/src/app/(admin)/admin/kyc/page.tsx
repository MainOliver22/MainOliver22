'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertCircle, Search } from 'lucide-react';

interface KycCaseAdmin {
  id: string;
  status: string;
  level: string;
  user?: { email: string; firstName: string; lastName: string };
  submittedAt?: string;
  createdAt: string;
  documents?: Array<{ name: string; status: string }>;
}

export default function AdminKycPage() {
  const [cases, setCases] = useState<KycCaseAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });
      const response = await api.get(`/admin/kyc?${params}`);
      setCases(response.data.cases || []);
      setTotal(response.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, search, statusFilter]);

  const approve = async (id: string) => {
    await api.patch(`/admin/kyc/${id}/approve`);
    fetchCases();
  };

  const reject = async (id: string) => {
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    await api.patch(`/admin/kyc/${id}/reject`, { reason });
    setRejecting(null);
    setReason('');
    fetchCases();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'IN_REVIEW':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'IN_REVIEW':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
        <div className="text-sm text-gray-500">Total: {total} cases</div>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as typeof statusFilter);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      {/* KYC Cases Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">No KYC cases found</td>
                </tr>
              ) : (
                cases.map((kycCase) => (
                  <tr key={kycCase.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {kycCase.user ? `${kycCase.user.firstName} ${kycCase.user.lastName}` : 'Unknown User'}
                      <br />
                      <span className="text-xs text-gray-500">{kycCase.user?.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{kycCase.level}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(kycCase.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(kycCase.status)}`}>
                          {kycCase.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(kycCase.createdAt)}</td>
                    <td className="px-4 py-3">
                      {(kycCase.status === 'PENDING' || kycCase.status === 'IN_REVIEW') && (
                        <>
                          {rejecting !== kycCase.id ? (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approve(kycCase.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="danger" onClick={() => setRejecting(kycCase.id)}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                placeholder="Rejection reason..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={2}
                              />
                              <div className="flex gap-1">
                                <Button size="sm" variant="danger" onClick={() => reject(kycCase.id)}>
                                  Confirm
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {kycCase.status !== 'PENDING' && kycCase.status !== 'IN_REVIEW' && (
                        <span className="text-xs text-gray-500">—</span>
                      )}
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
    </div>
  );
}
