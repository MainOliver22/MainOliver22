import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, trendLabel, className = '' }: StatCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;
  const trendColor = trend === undefined ? '' : trendPositive ? 'text-green-600' : 'text-red-600';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && (
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            {icon}
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          {trendPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{trendPositive ? '+' : ''}{trend.toFixed(2)}%</span>
          {trendLabel && <span className="text-gray-400 font-normal">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
