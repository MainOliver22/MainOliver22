import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CardDataStatsProps {
  title: string;
  total: string | number;
  rate?: string;
  trend?: 'up' | 'down';
  iconBg?: string;
  children: ReactNode;
}

export default function CardDataStats({
  title,
  total,
  rate,
  trend,
  iconBg = 'bg-[#3C50E0]',
  children,
}: CardDataStatsProps) {
  return (
    <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-full', iconBg)}>
        {children}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <h4 className="text-2xl font-bold text-[#1C2434]">{total}</h4>
          <span className="mt-0.5 block text-sm font-medium text-[#64748B]">{title}</span>
        </div>
        {rate && (
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 text-sm font-medium',
              trend === 'up' && 'text-[#219653]',
              trend === 'down' && 'text-[#D34053]',
              !trend && 'text-[#64748B]',
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {rate}
          </span>
        )}
      </div>
    </div>
  );
}
