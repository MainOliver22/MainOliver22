'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { Notification } from '@/types';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data.notifications || []));
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <Card>
          <CardHeader><CardTitle>All Notifications</CardTitle></CardHeader>
          {notifications.length === 0 ? <p className="text-sm text-gray-500">No notifications</p> : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={`flex justify-between items-start p-3 rounded-lg ${n.isRead ? 'bg-gray-50' : 'bg-blue-50'}`}>
                  <div>
                    <p className="text-sm font-semibold">{n.title}</p>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="text-xs text-gray-400">{formatDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>Mark read</Button>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
