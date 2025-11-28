import React from 'react';
import { cn } from '../../lib/utils';

type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'pending'
  | 'assigned'
  | 'completed'
  | 'cancelled'
  | 'available'
  | 'busy'
  | 'offline';

type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: cn(
    'bg-background-subtle text-text-secondary border-border-subtle',
    'dark:bg-surface-elevated'
  ),
  primary: cn(
    'bg-brand-50 text-brand-700 border-brand-200',
    'dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800'
  ),
  secondary: cn(
    'bg-accent-50 text-accent-700 border-accent-200',
    'dark:bg-accent-950 dark:text-accent-300 dark:border-accent-800'
  ),
  success: cn(
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  ),
  warning: cn(
    'bg-amber-50 text-amber-700 border-amber-200',
    'dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
  ),
  error: cn(
    'bg-red-50 text-red-700 border-red-200',
    'dark:bg-red-950 dark:text-red-300 dark:border-red-800'
  ),
  info: cn(
    'bg-blue-50 text-blue-700 border-blue-200',
    'dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
  ),
  // Status-specific variants
  pending: cn(
    'bg-amber-50 text-amber-700 border-amber-200',
    'dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
  ),
  assigned: cn(
    'bg-brand-50 text-brand-700 border-brand-200',
    'dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800'
  ),
  completed: cn(
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  ),
  cancelled: cn(
    'bg-slate-100 text-slate-500 border-slate-200',
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  ),
  available: cn(
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
  ),
  busy: cn(
    'bg-amber-50 text-amber-700 border-amber-200',
    'dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
  ),
  offline: cn(
    'bg-slate-100 text-slate-500 border-slate-200',
    'dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  ),
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-text-tertiary',
  primary: 'bg-brand-500',
  secondary: 'bg-accent-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  pending: 'bg-amber-500',
  assigned: 'bg-brand-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-slate-400',
  available: 'bg-emerald-500 animate-pulse',
  busy: 'bg-amber-500',
  offline: 'bg-slate-400',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 rounded-md',
  md: 'text-xs px-2 py-1 rounded-lg',
  lg: 'text-sm px-3 py-1.5 rounded-xl',
};

export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  icon,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold border whitespace-nowrap',
        'transition-colors duration-fast',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Helper function to get badge variant from booking status
export function getBookingStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return statusMap[status] || 'default';
}

// Helper function to get badge variant from driver status
export function getDriverStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    AVAILABLE: 'available',
    BUSY: 'busy',
    OFF_DUTY: 'offline',
  };
  return statusMap[status] || 'default';
}

export default Badge;
