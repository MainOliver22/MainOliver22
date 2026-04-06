import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { ArrowRight, BarChart3, Bot, Shield, Zap, TrendingUp, Lock, Globe } from 'lucide-react';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Bot Trading',
    description: 'Deploy proven algorithmic strategies with risk controls and real-time performance tracking. Let automation work for you 24/7.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: BarChart3,
    title: 'Multi-Asset Exchange',
    description: 'Convert between fiat and crypto instantly with live Binance price feeds, competitive rates, and transparent fees.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: 'TOTP two-factor authentication, JWT rotating tokens, bcrypt hashing, and HMAC-verified webhooks protect every transaction.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Zap,
    title: 'Instant KYC & Compliance',
    description: 'Onfido-powered identity verification with AML screening on every withdrawal keeps your account and funds secure.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Portfolio',
    description: 'Track balances across 10+ assets, monitor bot P&L, and get a complete picture of your investment performance.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Lock,
    title: 'Double-Entry Ledger',
    description: 'Every transfer uses atomic, pessimistic-locked double-entry accounting — the same standard used by global banks.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
];

const stats = [
  { value: '10+', label: 'Supported Assets' },
  { value: '99.9%', label: 'Platform Uptime' },
  { value: '< 30s', label: 'Quote Expiry' },
  { value: '7', label: 'Permission Roles' },
];

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Register in seconds with just your email. Enable 2FA immediately for maximum security.' },
  { num: '02', title: 'Complete KYC', desc: 'Upload your ID via Onfido. Approval unlocks deposits, withdrawals, and full trading access.' },
  { num: '03', title: 'Fund Your Wallet', desc: 'Deposit via card (Stripe) or connect your Web3 wallet with WalletConnect SIWE verification.' },
  { num: '04', title: 'Start Investing', desc: 'Trade assets manually, set up automated bots, or let backtesting pick the right strategy.' },
];

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-24 pb-32">
        {/* Background glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-0 right-0 h-[500px] w-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-emerald-600/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
            <Globe className="h-4 w-4" />
            Production-ready investment platform
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Intelligent Investing,{' '}
            <span className="gradient-text">Automated</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
            Trade crypto with AI-driven bots, exchange assets at live market rates, and manage your portfolio — all secured by bank-grade infrastructure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500 hover:shadow-blue-500/30"
            >
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg border px-7 py-3.5 text-sm font-semibold transition hover:bg-white/5"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground-muted)' }}
            >
              Sign In
            </Link>
          </div>

          {/* Stats bar */}
          <div
            className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-px rounded-2xl overflow-hidden sm:grid-cols-4"
            style={{ background: 'var(--border)' }}
          >
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center px-6 py-5" style={{ background: 'var(--surface-elevated)' }}>
                <span className="text-2xl font-bold text-white">{value}</span>
                <span className="mt-1 text-xs" style={{ color: 'var(--foreground-muted)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Everything You Need to Trade</h2>
            <p className="text-base" style={{ color: 'var(--foreground-muted)' }}>
              A complete platform stack — no plugins, no integrations, just invest.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className={`rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:shadow-lg ${bg}`}
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Up and Running in Minutes</h2>
            <p className="text-base" style={{ color: 'var(--foreground-muted)' }}>
              Four simple steps from sign-up to your first automated trade.
            </p>
          </div>

          <div className="space-y-6">
            {steps.map(({ num, title, desc }) => (
              <div
                key={num}
                className="flex gap-6 rounded-2xl border p-6 transition hover:border-blue-500/30"
                style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}
              >
                <span className="shrink-0 text-3xl font-black text-blue-500/30">{num}</span>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24" style={{ background: 'var(--surface)' }}>
        <div
          className="mx-auto max-w-3xl rounded-3xl border p-12 text-center glow-blue"
          style={{ borderColor: 'rgba(59,130,246,0.2)', background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)' }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">Ready to Automate Your Investments?</h2>
          <p className="mb-8 text-base" style={{ color: 'var(--foreground-muted)' }}>
            Join the platform that combines professional trading tools with institutional-grade security.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-500"
          >
            Create Free Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm sm:flex-row" style={{ color: 'var(--foreground-muted)' }}>
          <span className="font-bold text-white">InvestPlatform</span>
          <span>© {new Date().getFullYear()} InvestPlatform. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/auth/login" className="hover:text-white transition">Sign In</Link>
            <Link href="/auth/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
