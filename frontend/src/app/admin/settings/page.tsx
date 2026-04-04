'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import api from '@/lib/api';

interface HealthData { status: string; timestamp: string; version: string; }

export default function AdminSettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    api.get('/admin/health').then(r => setHealth(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
          {health ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-semibold ${health.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{health.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium">{health.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last checked</span>
                <span className="text-sm text-gray-500">{new Date(health.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Loading health data...</p>
          )}
        </Card>
        <Card>
          <CardHeader><CardTitle>Platform Info</CardTitle></CardHeader>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Platform</span>
              <span className="text-sm font-medium">qfx-finance.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API URL</span>
              <span className="text-sm text-gray-500 font-mono">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
