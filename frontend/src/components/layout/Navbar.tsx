'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Bell, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-blue-600">InvestPlatform</Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Dashboard</Link>
            <Link href="/bots" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Bots</Link>
            <Link href="/exchange" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Exchange</Link>
            <Link href="/wallets" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Deposit</Link>
            <Link href="/wallets" className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">Withdraw</Link>
            <Link href="/notifications" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"><Bell className="h-5 w-5" /></Link>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <span className="text-sm text-gray-700 dark:text-gray-200">{user.firstName}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            <Link href="/auth/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link href="/auth/register"><Button size="sm">Register</Button></Link>
          </>
        )}
        <ThemeToggle />
      </div>
    </nav>
  );
}
