'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  Bot,
  FileText,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const menuLinks: NavItem[] = [
  { href: '/admin', icon: BarChart3, label: 'Dashboard' },
];

const managementLinks: NavItem[] = [
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/kyc', icon: ShieldCheck, label: 'KYC Queue' },
  { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/admin/exchange', icon: TrendingUp, label: 'Exchange' },
  { href: '/admin/bots', icon: Bot, label: 'Bots' },
];

const systemLinks: NavItem[] = [
  { href: '/admin/audit', icon: FileText, label: 'Audit Logs' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
];

function NavGroup({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div className="mb-2">
      <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-[#8899A8]">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ href, icon: Icon, label: itemLabel }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-[#3C50E0] text-white'
                    : 'text-[#8899A8] hover:bg-[#313D4A] hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {itemLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 shrink-0 flex-col bg-[#1C2434] min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-2.5 border-b border-[#313D4A] px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3C50E0]">
          <BarChart3 className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">InvestAdmin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        <NavGroup label="Menu" items={menuLinks} pathname={pathname} />
        <NavGroup label="Management" items={managementLinks} pathname={pathname} />
        <NavGroup label="System" items={systemLinks} pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="border-t border-[#313D4A] px-6 py-4">
        <p className="text-[11px] text-[#8899A8]">Investment Platform v1.0</p>
      </div>
    </aside>
  );
}
