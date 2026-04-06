'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { User } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchUsers = () => {
    api.get(`/admin/users?page=${page}&limit=20`).then(r => {
      setUsers(r.data.users || []);
      setTotal(r.data.total || 0);
    });
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const freeze = async (id: string) => { await api.patch(`/admin/users/${id}/freeze`); fetchUsers(); };
  const unfreeze = async (id: string) => { await api.patch(`/admin/users/${id}/unfreeze`); fetchUsers(); };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1C2434]">Users</h1>
        <p className="mt-1 text-sm text-[#64748B]">{total} total registered users</p>
      </div>

      <div className="rounded-[10px] border border-[#E2E8F0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F7F9FC]">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F7F9FC] transition-colors">
                  <td className="px-6 py-4 font-medium text-[#1C2434]">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        u.status === 'ACTIVE'
                          ? 'bg-[#EBFBF2] text-[#219653]'
                          : 'bg-[#FEF3F2] text-[#D34053]',
                      )}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#64748B]">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {u.status === 'FROZEN' ? (
                      <Button size="sm" variant="secondary" onClick={() => unfreeze(u.id)}>
                        Unfreeze
                      </Button>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => freeze(u.id)}>
                        Freeze
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[#64748B]">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] px-6 py-4">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Previous
          </Button>
          <span className="text-sm text-[#64748B]">Page {page}</span>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => p + 1)}>
            Next →
          </Button>
        </div>
      </div>
    </div>
  );
}
