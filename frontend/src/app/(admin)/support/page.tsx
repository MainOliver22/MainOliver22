'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supportApi } from '@/lib/api';
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

const CATEGORIES = ['PAYMENTS', 'KYC', 'BOTS', 'EXCHANGE', 'ACCOUNT', 'OTHER'];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'PAYMENTS',
    priority: 'MEDIUM',
  });

  const loadTickets = async () => {
    try {
      const data = await supportApi.getMyTickets(1, 20);
      setTickets(data.tickets);
    } catch {
      // user has no tickets yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await supportApi.createTicket(form);
      setSuccess('Your ticket has been submitted. Our support team will respond within 1–2 business days.');
      setShowForm(false);
      setForm({ subject: '', description: '', category: 'PAYMENTS', priority: 'MEDIUM' });
      await loadTickets();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support</h1>
            <p className="text-sm text-gray-500 mt-0.5">Raise and track support tickets</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            {showForm ? 'Cancel' : '+ New Ticket'}
          </Button>
        </div>

        {success && (
          <p className="text-sm text-green-700 bg-green-50 px-4 py-3 rounded-lg">{success}</p>
        )}

        {/* New ticket form */}
        {showForm && (
          <Card>
            <CardHeader><CardTitle>New Support Ticket</CardTitle></CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Subject"
                placeholder="Brief summary of your issue"
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Describe your issue in detail..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  minLength={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" loading={submitting}>Submit Ticket</Button>
            </form>
          </Card>
        )}

        {/* Tickets list */}
        {loading ? (
          <Card><p className="text-sm text-gray-500 animate-pulse">Loading tickets…</p></Card>
        ) : tickets.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-sm text-gray-400 mb-3">No support tickets yet</p>
              <Button size="sm" onClick={() => setShowForm(true)}>Open a Ticket</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => (
              <Card key={ticket.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                    <p className="text-sm text-gray-500 truncate mt-0.5">{ticket.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                  <span>{ticket.category}</span>
                  <span>·</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
