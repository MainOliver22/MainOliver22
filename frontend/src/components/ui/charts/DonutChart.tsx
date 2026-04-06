'use client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, PieLabelRenderProps } from 'recharts';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  title?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: PieLabelRenderProps) {
  const numCx = Number(cx ?? 0);
  const numCy = Number(cy ?? 0);
  const numInner = Number(innerRadius ?? 0);
  const numOuter = Number(outerRadius ?? 0);
  const numPercent = Number(percent ?? 0);
  if (numPercent < 0.05) return null;
  const radius = numInner + (numOuter - numInner) * 0.5;
  const x = numCx + radius * Math.cos(-Number(midAngle ?? 0) * RADIAN);
  const y = numCy + radius * Math.sin(-Number(midAngle ?? 0) * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(numPercent * 100).toFixed(0)}%`}
    </text>
  );
}

export function DonutChart({
  data,
  title,
  height = 260,
  innerRadius = 55,
  outerRadius = 95,
  className = '',
}: DonutChartProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 ${className}`}>
      {title && <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(2)}`, '']}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
