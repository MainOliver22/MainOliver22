'use client';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';

type Step = 'idle' | 'setup' | 'confirming';

export default function SettingsPage() {
  const { user, refetch } = useAuth();

  // 2FA setup state
  const [step, setStep] = useState<Step>('idle');
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEnable2fa = async () => {
    setLoading(true);
    setError('');
    try {
      const { otpauthUrl, secret: s } = await authApi.enable2fa();
      setSecret(s);
      // Build QR code URL using Google Charts API
      setQrUrl(`https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauthUrl)}`);
      setStep('setup');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to start 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2fa = async () => {
    setLoading(true);
    setError('');
    try {
      await authApi.confirm2fa(totpCode);
      setSuccess('Two-factor authentication enabled successfully.');
      setStep('idle');
      setTotpCode('');
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Invalid code. Please check your authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2fa = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authApi.disable2fa(disableCode);
      setSuccess('Two-factor authentication has been disabled.');
      setDisableCode('');
      refetch();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Invalid code. Please check your authenticator app.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your security settings</p>
        </div>

        {/* Profile info */}
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <dl className="space-y-3 text-sm">
            {[
              ['Email', user?.email ?? '—'],
              ['Name', user ? `${user.firstName} ${user.lastName}` : '—'],
              ['Role', user?.role ?? '—'],
              ['Status', user?.status ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                <dt className="text-gray-500">{label}</dt>
                <dd className="font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* 2FA */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Two-Factor Authentication</CardTitle>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user?.twoFactorEnabled
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </CardHeader>

          {success && (
            <p className="mb-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{success}</p>
          )}
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          {/* Not enabled — show setup flow */}
          {!user?.twoFactorEnabled && step === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account. You will need an authenticator app (e.g. Google Authenticator, Authy).
              </p>
              <Button onClick={handleEnable2fa} loading={loading} size="sm">
                Set up 2FA
              </Button>
            </div>
          )}

          {!user?.twoFactorEnabled && step === 'setup' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                1. Scan the QR code with your authenticator app, or manually enter the secret key below.
              </p>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrUrl} alt="2FA QR code" width={200} height={200} className="rounded-lg border" />
              </div>
              <div className="bg-gray-50 rounded-md p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Manual entry secret key</p>
                <p className="font-mono text-sm text-gray-800 break-all">{secret}</p>
              </div>
              <p className="text-sm text-gray-600">
                2. Enter the 6-digit code from your app to confirm setup:
              </p>
              <Input
                label="Verification code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={e => setTotpCode(e.target.value)}
              />
              <div className="flex gap-3">
                <Button onClick={handleConfirm2fa} loading={loading} disabled={totpCode.length !== 6}>
                  Confirm & Enable
                </Button>
                <Button variant="ghost" onClick={() => { setStep('idle'); setError(''); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Already enabled — offer to disable */}
          {user?.twoFactorEnabled && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Your account is protected by 2FA. To disable it, enter a valid code from your authenticator app.
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    label="Current 2FA code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={disableCode}
                    onChange={e => setDisableCode(e.target.value)}
                  />
                </div>
                <Button
                  variant="danger"
                  loading={loading}
                  disabled={disableCode.length !== 6}
                  onClick={handleDisable2fa}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
