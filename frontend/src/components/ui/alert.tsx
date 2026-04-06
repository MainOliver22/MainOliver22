import { ReactNode } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const CONFIG: Record<AlertVariant, { icon: ReactNode; bg: string; border: string; title: string; text: string }> = {
  info: {
    icon: <Info className="h-4 w-4" />,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  success: {
    icon: <CheckCircle className="h-4 w-4" />,
    bg: 'bg-green-50',
    border: 'border-green-200',
    title: 'text-green-800',
    text: 'text-green-700',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    bg: 'bg-red-50',
    border: 'border-red-200',
    title: 'text-red-800',
    text: 'text-red-700',
  },
};

export function Alert({ variant = 'info', title, children, onDismiss, className = '' }: AlertProps) {
  const cfg = CONFIG[variant];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${cfg.bg} ${cfg.border} ${className}`} role="alert">
      <span className={`mt-0.5 shrink-0 ${cfg.title}`}>{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold mb-0.5 ${cfg.title}`}>{title}</p>}
        <div className={`text-sm ${cfg.text}`}>{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className={`shrink-0 mt-0.5 p-0.5 rounded hover:bg-black/10 transition-colors ${cfg.title}`}
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
