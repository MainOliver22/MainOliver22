'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminSupportApi } from '@/lib/api';
import { SupportTicket } from '@/types';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  WAITING_ON_USER: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-gray-100 text-gray-500',
  CLOSED: 'bg-gray-100 text-gray-500',
};

const TICKET_STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'WAITING_ON_USER', 'RESOLVED', 'CLOSED'];

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const data = await adminSupportApi.getAll(1, 50, status || undefined);
      setTickets(data.tickets);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await adminSupportApi.update(id, { status });
      await load(statusFilter);
    } finally {
      setActionLoading(null);
    }
  };

  const resolveTicket = async (id: string) => {
    setActionLoading(id);
    try {
      await adminSupportApi.resolve(id);
      await load(statusFilter);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} ticket{total !== 1 ? 's' : ''} found</p>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TICKET_STATUSES.map(s => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Card><p className="text-sm text-gray-400 animate-pulse">Loading tickets…</p></Card>
      ) : tickets.length === 0 ? (
        <Card><p className="text-sm text-gray-400 text-center py-6">No tickets found</p></Card>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <Card key={ticket.id}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{ticket.subject}</p>
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{ticket.description}</p>
                  {ticket.user && (
                    <p className="text-xs text-gray-400 mt-1">
                      From: {ticket.user.firstName} {ticket.user.lastName} ({ticket.user.email})
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className="flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] ?? ''}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] ?? ''}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === 'OPEN' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={actionLoading === ticket.id}
                        onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')}
                      >
                        Start
                      </Button>
                    )}
                    {['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER'].includes(ticket.status) && (
                      <Button
                        size="sm"
                        loading={actionLoading === ticket.id}
                        onClick={() => resolveTicket(ticket.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {ticket.category} · {new Date(ticket.createdAt).toLocaleString()}
                {ticket.assignee && ` · Assigned to: ${ticket.assignee.firstName}`}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
