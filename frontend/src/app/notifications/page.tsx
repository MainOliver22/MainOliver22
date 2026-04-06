'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/alert';
import api from '@/lib/api';
import { Notification } from '@/types';
import { formatDate } from '@/lib/utils';

function notificationVariant(type: string): 'info' | 'success' | 'warning' | 'error' {
  if (type === 'SUCCESS' || type === 'DEPOSIT_CONFIRMED' || type === 'KYC_APPROVED') return 'success';
  if (type === 'ERROR' || type === 'WITHDRAWAL_FAILED' || type === 'KYC_REJECTED') return 'error';
  if (type === 'WARNING' || type === 'BOT_STOPPED') return 'warning';
  return 'info';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data.notifications || []));
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <Card>
          <CardHeader><CardTitle>All Notifications</CardTitle></CardHeader>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No notifications</p>
          ) : (
            <div className="space-y-3">
              {notifications.map(n => (
                <div key={n.id} className={n.isRead ? 'opacity-60' : ''}>
                  <Alert
                    variant={notificationVariant(n.type)}
                    title={n.title}
                    onDismiss={() => dismiss(n.id)}
                  >
                    <p>{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">{formatDate(n.createdAt)}</span>
                      {!n.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  </Alert>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
