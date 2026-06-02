'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import { User } from '@/types';
import { Search, Download, Eye, Lock, Unlock } from 'lucide-react';

interface UserDetailModalProps {
  user: User | null;
  onClose: () => void;
  onAction: (action: string, userId: string) => Promise<void>;
}

function UserDetailModal({ user, onClose, onAction }: UserDetailModalProps) {
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleAction = async (action: string) => {
    setLoading(true);
    try {
      await onAction(action, user.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg max-h-96 overflow-y-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>User Details</CardTitle>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </CardHeader>
        <div className="px-6 pb-6 space-y-4">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-medium">{user.firstName} {user.lastName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className={`font-medium ${user.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{user.status}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2 pt-4">
            {user.status === 'FROZEN' ? (
              <Button variant="secondary" className="flex-1" onClick={() => handleAction('unfreeze')} disabled={loading}>
                <Unlock className="h-4 w-4 mr-2" />
                Unfreeze
              </Button>
            ) : (
              <Button variant="danger" className="flex-1" onClick={() => handleAction('freeze')} disabled={loading}>
                <Lock className="h-4 w-4 mr-2" />
                Freeze
              </Button>
            )}
            <Button variant="ghost" className="flex-1" onClick={onClose}>Close</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'FROZEN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(status !== 'ALL' && { status }),
      });
      const response = await api.get(`/admin/users?${params}`);
      setUsers(response.data.users || []);
      setTotal(response.data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, status]);

  const handleUserAction = async (action: string, userId: string) => {
    await api.patch(`/admin/users/${userId}/${action}`);
    fetchUsers();
  };

  const exportUsers = async () => {
    const response = await api.get('/admin/users/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `users-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <div className="text-sm text-gray-500">Total: {total} users</div>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as 'ALL' | 'ACTIVE' | 'FROZEN');
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="FROZEN">Frozen</option>
            </select>
            <Button variant="secondary" onClick={exportUsers} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedUser(user)}
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

      {/* User Detail Modal */}
      <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onAction={handleUserAction} />
    </div>
  );
}
