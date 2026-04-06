'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bell, User, LayoutDashboard, Bot, ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav
      className="sticky top-0 z-50 border-b px-6 py-3 flex items-center justify-between backdrop-blur-md"
      style={{ background: 'rgba(11,15,26,0.85)', borderColor: 'var(--border)' }}
    >
      <Link href="/" className="text-lg font-bold text-white tracking-tight">
        Invest<span className="text-blue-400">Platform</span>
      </Link>

      <div className="flex items-center gap-1">
        {user ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link href="/bots" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <Bot className="h-4 w-4" /> Bots
            </Link>
            <Link href="/exchange" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <ArrowLeftRight className="h-4 w-4" /> Exchange
            </Link>
            <Link href="/deposit" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <ArrowDownToLine className="h-4 w-4" /> Deposit
            </Link>
            <Link href="/withdraw" className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </Link>
            <Link href="/notifications" className="relative rounded-md p-1.5 transition hover:bg-white/5" style={{ color: 'var(--foreground-muted)' }}>
              <Bell className="h-4 w-4" />
            </Link>
            <div className="ml-2 flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: 'var(--border)', background: 'var(--surface-elevated)' }}>
              <User className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-white">{user.firstName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="ml-1 text-sm">Logout</Button>
          </>
        ) : (
          <>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
