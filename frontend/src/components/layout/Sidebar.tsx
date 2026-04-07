'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck, CreditCard, TrendingUp, Bot, FileText, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', icon: BarChart3, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/kyc', icon: ShieldCheck, label: 'KYC Queue' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/exchange', icon: TrendingUp, label: 'Exchange' },
  { href: '/admin/bots', icon: Bot, label: 'Bots' },
  { href: '/audit', icon: FileText, label: 'Audit Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 min-h-screen p-4">
      <div className="text-white font-bold text-lg mb-8 px-2">Admin Panel</div>
      <nav className="space-y-1">
        {adminLinks.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} className={cn('flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors', pathname === href ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white')}>
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
