'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserMenu } from '@/components/header/UserMenu';
import { Bell } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-600">InvestPlatform</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Dashboard</Link>
            <Link href="/bots" className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Bots</Link>
            <Link href="/exchange" className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Exchange</Link>
            <Link href="/deposit" className="text-sm text-gray-600 hover:text-gray-900 hidden md:block">Deposit</Link>
            <Link href="/notifications" className="relative text-gray-600 hover:text-gray-900">
              <Bell className="h-5 w-5" />
            </Link>
            <UserMenu />
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
