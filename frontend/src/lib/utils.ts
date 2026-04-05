import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number, symbol: string = 'USD') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (symbol === 'USD') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  return `${num.toFixed(8)} ${symbol}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleString();
}
