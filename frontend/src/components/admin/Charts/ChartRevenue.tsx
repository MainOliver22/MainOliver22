'use client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface ChartRevenueDataPoint {
  label: string;
  deposits: number;
  withdrawals: number;
}

interface ChartRevenueProps {
  data: ChartRevenueDataPoint[];
}

export default function ChartRevenue({ data }: ChartRevenueProps) {
  return (
    <div className="rounded-[10px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h4 className="text-lg font-semibold text-[#1C2434]">Revenue Overview</h4>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#3C50E0]" />
            <span className="text-xs text-[#64748B]">Deposits</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-[#80CAEE]" />
            <span className="text-xs text-[#64748B]">Withdrawals</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="depositsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3C50E0" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="withdrawalsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#80CAEE" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#80CAEE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                fontSize: 12,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07)',
              }}
              formatter={(v, name) => [
                `$${(typeof v === 'number' ? v : 0).toFixed(2)}`,
                String(name ?? ''),
              ]}
            />
            <Area
              type="monotone"
              dataKey="deposits"
              stroke="#3C50E0"
              strokeWidth={2}
              fill="url(#depositsGrad)"
            />
            <Area
              type="monotone"
              dataKey="withdrawals"
              stroke="#80CAEE"
              strokeWidth={2}
              fill="url(#withdrawalsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
