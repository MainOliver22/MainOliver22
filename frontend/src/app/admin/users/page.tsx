'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { User } from '@/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchUsers = () => {
    api.get(`/admin/users?page=${page}&limit=20`).then(r => { setUsers(r.data.users || []); setTotal(r.data.total || 0); });
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const freeze = async (id: string) => { await api.patch(`/admin/users/${id}/freeze`); fetchUsers(); };
  const unfreeze = async (id: string) => { await api.patch(`/admin/users/${id}/unfreeze`); fetchUsers(); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-white">Users ({total})</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b">
              <th className="pb-3 pr-4">Name</th><th className="pb-3 pr-4">Email</th>
              <th className="pb-3 pr-4">Role</th><th className="pb-3 pr-4">Status</th>
              <th className="pb-3 pr-4">Joined</th><th className="pb-3">Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="py-3 pr-4 text-slate-400">{u.email}</td>
                  <td className="py-3 pr-4"><span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full text-xs">{u.role}</span></td>
                  <td className="py-3 pr-4"><span className={`px-2 py-0.5 rounded-full text-xs ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{u.status}</span></td>
                  <td className="py-3 pr-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    {u.status === 'FROZEN' ? <Button size="sm" variant="secondary" onClick={() => unfreeze(u.id)}>Unfreeze</Button> : <Button size="sm" variant="danger" onClick={() => freeze(u.id)}>Freeze</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-slate-400">Page {page}</span>
          <Button size="sm" variant="ghost" onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
