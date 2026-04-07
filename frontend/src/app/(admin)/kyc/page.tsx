'use client';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { kycApi } from '@/lib/api';
import { KycCase } from '@/types';

// ── Status badge ───────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-600',   label: 'Not started' },
  PENDING:     { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending review' },
  IN_REVIEW:   { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'In review' },
  APPROVED:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Approved' },
  REJECTED:    { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Rejected' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: 'bg-gray-100', text: 'text-gray-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEPS = ['Personal Info', 'Document Type', 'Review'];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="KYC steps" className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                done   ? 'bg-blue-600 border-blue-600 text-white' :
                active ? 'border-blue-600 text-blue-600 bg-white' :
                         'border-gray-300 text-gray-400 bg-white'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${done ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ── Document types ─────────────────────────────────────────────────────────────
const DOCUMENT_TYPES = [
  { value: 'passport',        label: 'Passport',           description: 'International travel document' },
  { value: 'drivers_license', label: "Driver's License",   description: 'Government-issued driving permit' },
  { value: 'national_id',    label: 'National ID Card',    description: 'National identity document' },
];

// ── Form state ─────────────────────────────────────────────────────────────────
interface FormState {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  dateOfBirth: '',
  nationality: '',
  documentType: 'passport',
};

// ── Page ───────────────────────────────────────────────────────────────────────
export default function KycPage() {
  const [kycCase, setKycCase] = useState<KycCase | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [step, setStep] = useState(0); // 0 = personal, 1 = doc type, 2 = review
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    kycApi.getStatus()
      .then(data => setKycCase(data))
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value })),
  });

  const validateStep0 = () =>
    form.fullName.trim().length >= 2 &&
    form.dateOfBirth !== '' &&
    form.nationality.trim().length >= 2;

  const handleStart = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await kycApi.start('BASIC');
      setKycCase(res.kycCase);
      setSuccess('KYC verification started! Complete the process with our provider.');
      if (res.redirectUrl) window.open(res.redirectUrl, '_blank');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to start KYC. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async () => {
    setKycCase(null);
    setStep(0);
    setForm(INITIAL_FORM);
    setError('');
    setSuccess('');
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingStatus) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification (KYC)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Verify your identity to unlock full platform access</p>
        </div>
        <Card><p className="text-sm text-gray-500 animate-pulse">Loading verification status…</p></Card>
      </div>
    );
  }

  // ── Already has a case (and not rejected / restarting) ───────────────────────
  if (kycCase && kycCase.status !== 'NOT_STARTED') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification (KYC)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Verify your identity to unlock full platform access</p>
        </div>

        <Card className="max-w-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Verification Status</CardTitle>
              <StatusBadge status={kycCase.status} />
            </div>
          </CardHeader>

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Verification level</dt>
              <dd className="font-medium text-gray-900">{kycCase.level}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <dt className="text-gray-500">Submitted</dt>
              <dd className="font-medium text-gray-900">{new Date(kycCase.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>

          {success && (
            <p className="mt-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">{success}</p>
          )}

          {kycCase.status === 'APPROVED' && (
            <div className="mt-4 bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium">✓ Your identity has been verified</p>
              <p className="text-sm text-green-700 mt-1">You have full access to deposits, withdrawals, and bot trading.</p>
            </div>
          )}

          {kycCase.status === 'PENDING' || kycCase.status === 'IN_REVIEW' ? (
            <div className="mt-4 bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">Your submission is being reviewed</p>
              <p className="text-sm text-blue-700 mt-1">This typically takes 1–2 business days. We will notify you by email.</p>
            </div>
          ) : null}

          {kycCase.status === 'REJECTED' && (
            <div className="mt-4 space-y-3">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Verification was not successful</p>
                <p className="text-sm text-red-700 mt-1">Please restart the process and ensure your documents are clear and valid.</p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}
              <Button onClick={handleRetry} variant="danger">Retry Verification</Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── Wizard ───────────────────────────────────────────────────────────────────
  const docType = DOCUMENT_TYPES.find(d => d.value === form.documentType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Identity Verification (KYC)</h1>
        <p className="text-sm text-gray-500 mt-0.5">Complete all steps to verify your identity</p>
      </div>

      <div className="max-w-xl">
        <StepIndicator current={step} />

        {/* ── Step 1: Personal Info ─────────────────────────────────────────── */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Enter your details exactly as they appear on your ID document.</p>
            </CardHeader>

            <div className="space-y-4">
              <Input
                label="Full name"
                placeholder="As it appears on your ID"
                {...field('fullName')}
              />
              <Input
                label="Date of birth"
                type="date"
                {...field('dateOfBirth')}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Nationality</label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...field('nationality')}
                >
                  <option value="">Select country…</option>
                  {['United States', 'United Kingdom', 'Germany', 'France', 'Canada', 'Australia',
                    'Japan', 'Singapore', 'United Arab Emirates', 'Switzerland', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => setStep(1)} disabled={!validateStep0()}>
                  Continue →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 2: Document Type ─────────────────────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Document Type</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Select the identity document you will use with our verification partner.
              </p>
            </CardHeader>

            <div className="space-y-3">
              {DOCUMENT_TYPES.map(dt => (
                <label
                  key={dt.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    form.documentType === dt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="documentType"
                    value={dt.value}
                    checked={form.documentType === dt.value}
                    onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dt.description}</p>
                  </div>
                </label>
              ))}

              <div className="pt-2 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>← Back</Button>
                <Button onClick={() => setStep(2)}>Continue →</Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Step 3: Review & Submit ───────────────────────────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Confirm</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Check your details, then start the verification process.
              </p>
            </CardHeader>

            <dl className="space-y-3 text-sm mb-6">
              {[
                ['Full name',      form.fullName],
                ['Date of birth',  form.dateOfBirth],
                ['Nationality',    form.nationality],
                ['Document type',  docType?.label ?? form.documentType],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">What happens next?</p>
              <p className="text-sm text-blue-700 mt-1">
                You will be redirected to our secure identity verification partner to complete
                document upload and facial recognition. This usually takes under 5 minutes.
              </p>
            </div>

            {error && <p className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={handleStart} loading={submitting}>
                Start Verification
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
