import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CardDataStatsProps {
  title: string;
  total: string | number;
  rate?: string;
  levelUp?: boolean;
  levelDown?: boolean;
  iconBg?: string;
  children: ReactNode;
}

export default function CardDataStats({
  title,
  total,
  rate,
  levelUp,
  levelDown,
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
              levelUp && 'text-[#219653]',
              levelDown && 'text-[#D34053]',
              !levelUp && !levelDown && 'text-[#64748B]',
            )}
          >
            {levelUp && <TrendingUp className="h-3.5 w-3.5" />}
            {levelDown && <TrendingDown className="h-3.5 w-3.5" />}
            {rate}
          </span>
        )}
      </div>
    </div>
  );
}
