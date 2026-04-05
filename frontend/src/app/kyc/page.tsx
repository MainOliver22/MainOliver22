'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import { KycCase } from '@/types';

export default function KycPage() {
  const [kycCase, setKycCase] = useState<KycCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.get('/kyc/status').then(r => setKycCase(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const startKyc = async () => {
    setStarting(true);
    try {
      const res = await api.post('/kyc/start', { level: 'BASIC' });
      setKycCase(res.data.kycCase);
      if (res.data.redirectUrl) window.open(res.data.redirectUrl, '_blank');
    } finally {
      setStarting(false);
    }
  };

  const statusColors: Record<string, string> = {
    NOT_STARTED: 'text-gray-600', PENDING: 'text-yellow-600', IN_REVIEW: 'text-blue-600',
    APPROVED: 'text-green-600', REJECTED: 'text-red-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Identity Verification (KYC)</h1>
        <Card>
          <CardHeader><CardTitle>Verification Status</CardTitle></CardHeader>
          {loading ? <p className="text-sm text-gray-500">Loading...</p> : (
            <div className="space-y-4">
              {kycCase ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`text-sm font-semibold ${statusColors[kycCase.status] || ''}`}>{kycCase.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Level</span>
                    <span className="text-sm">{kycCase.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Submitted</span>
                    <span className="text-sm">{new Date(kycCase.createdAt).toLocaleDateString()}</span>
                  </div>
                  {kycCase.status === 'REJECTED' && (
                    <Button onClick={startKyc} loading={starting} variant="danger">Retry Verification</Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">KYC verification is required to unlock deposits, withdrawals, and bot trading.</p>
                  <Button onClick={startKyc} loading={starting}>Start KYC Verification</Button>
                </div>
              )}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
