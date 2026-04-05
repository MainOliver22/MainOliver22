'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Bell, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-600">InvestPlatform</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link href="/bots" className="text-sm text-gray-600 hover:text-gray-900">Bots</Link>
            <Link href="/exchange" className="text-sm text-gray-600 hover:text-gray-900">Exchange</Link>
            <Link href="/deposit" className="text-sm text-gray-600 hover:text-gray-900">Deposit</Link>
            <Link href="/withdraw" className="text-sm text-gray-600 hover:text-gray-900">Withdraw</Link>
            <Link href="/notifications" className="relative text-gray-600 hover:text-gray-900"><Bell className="h-5 w-5" /></Link>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm text-gray-700">{user.firstName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            <Link href="/auth/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link href="/auth/register"><Button size="sm">Register</Button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
