'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck, CreditCard, TrendingUp, Bot, FileText, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', icon: BarChart3, label: 'Dashboard', section: 'overview' },
  { section: 'management', label: 'Management' },
  { href: '/admin/users', icon: Users, label: 'Users', section: 'management' },
  { href: '/admin/kyc', icon: ShieldCheck, label: 'KYC Queue', section: 'management' },
  { section: 'operations', label: 'Operations' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments', section: 'operations' },
  { href: '/admin/exchange', icon: TrendingUp, label: 'Exchange', section: 'operations' },
  { href: '/admin/bots', icon: Bot, label: 'Bots', section: 'operations' },
  { section: 'monitoring', label: 'Monitoring' },
  { href: '/admin/audit', icon: FileText, label: 'Audit Logs', section: 'monitoring' },
  { section: 'system', label: 'System' },
  { href: '/admin/settings', icon: Settings, label: 'Settings', section: 'system' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const groupedLinks = adminLinks.reduce((acc, item) => {
    if (!item.href) {
      acc.push({ type: 'header', section: item.section, label: item.label });
    } else {
      acc.push({ type: 'link', ...item });
    }
    return acc;
  }, [] as any[]);

  return (
    <aside className="w-64 bg-slate-900 min-h-screen p-4 border-r border-slate-800">
      <div className="px-2 py-4 mb-8">
        <h1 className="text-white font-bold text-xl">Fortress Fund</h1>
        <p className="text-slate-400 text-xs mt-1">Admin Dashboard</p>
      </div>
      <nav className="space-y-6">
        {groupedLinks.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div key={`header-${idx}`} className="px-3 pt-4 pb-2">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{item.label}</p>
              </div>
            );
          }

          const { href, icon: Icon, label } = item;
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{label}</span>
              {isActive && <div className="ml-auto h-1 w-1 rounded-full bg-white" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 border-t border-slate-800 pt-4">
        <div className="text-xs text-slate-500 text-center">
          <p>v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
