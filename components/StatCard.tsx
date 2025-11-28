
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: 'emerald' | 'brand' | 'amber' | 'slate';
}

const colorVariants = {
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  brand: {
    bg: 'bg-brand-50 dark:bg-brand-950',
    text: 'text-brand-600 dark:text-brand-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    text: 'text-amber-600 dark:text-amber-400',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
  },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = 'slate' }) => {
  const variant = colorVariants[color];

  return (
    <div className="bg-surface p-6 rounded-2xl shadow-card hover:shadow-soft transition-all border border-border group hover:border-brand-500/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-tertiary tracking-wide">{title}</p>
          <h3 className="text-3xl font-bold text-text-primary mt-2 tracking-tight">{value}</h3>
          {trend && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 bg-emerald-50 dark:bg-emerald-950 inline-block px-2 py-1 rounded-full">
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${variant.bg} ${variant.text} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
