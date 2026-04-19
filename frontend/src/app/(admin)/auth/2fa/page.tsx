'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { setTokens } from '@/lib/auth';

const schema = z.object({
  code: z.string().length(6, 'Enter the 6-digit code from your authenticator app'),
});

type FormData = z.infer<typeof schema>;

function TwoFaVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams.get('token') ?? '';

  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await authApi.verify2fa(tempToken, data.code);
      setTokens(result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Invalid code. Please try again.');
    }
  };

  if (!tempToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Invalid Request</CardTitle></CardHeader>
          <p className="text-sm text-gray-600">No verification token found. Please log in again.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Open your authenticator app and enter the 6-digit code.
          </p>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Verification Code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            autoFocus
            {...register('code')}
            error={errors.code?.message}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Verify
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function TwoFaVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    }>
      <TwoFaVerifyForm />
    </Suspense>
  );
}
