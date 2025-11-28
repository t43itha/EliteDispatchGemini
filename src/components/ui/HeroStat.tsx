import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '../../lib/utils';

interface HeroStatProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down';
  };
  variant?: 'default' | 'gradient' | 'glow';
  className?: string;
}

export function HeroStat({
  title,
  value,
  prefix = '',
  suffix = '',
  icon: Icon,
  trend,
  variant = 'gradient',
  className,
}: HeroStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'relative overflow-hidden rounded-3xl p-8',
        'bg-gradient-to-br from-surface via-surface to-surface-elevated',
        'border border-border',
        'group',
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-accent-500/5" />
      </div>

      {/* Glow effect */}
      {variant === 'glow' && (
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-accent-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
            {title}
          </span>
          {Icon && (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 rounded-2xl bg-brand-500/10 text-brand-500"
            >
              <Icon className="w-5 h-5" />
            </motion.div>
          )}
        </div>

        {/* Value */}
        <div className="mb-4">
          <AnimatedCounter
            value={value}
            prefix={prefix}
            suffix={suffix}
            className={cn(
              'text-5xl md:text-6xl font-black tracking-tight',
              variant === 'gradient'
                ? 'bg-gradient-to-r from-text-primary via-brand-500 to-accent-500 bg-clip-text text-transparent'
                : 'text-text-primary'
            )}
          />
        </div>

        {/* Trend */}
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold',
              trend.direction === 'up'
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-red-500/10 text-red-500'
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>{trend.value}%</span>
            <span className="text-text-tertiary font-medium">{trend.label}</span>
          </motion.div>
        )}
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-brand-500/10 to-transparent rounded-tl-full opacity-50" />
    </motion.div>
  );
}

// Compact stat for secondary metrics
interface MiniStatProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: 'brand' | 'emerald' | 'amber' | 'slate';
  className?: string;
}

const colorStyles = {
  brand: {
    bg: 'bg-brand-500/10 dark:bg-brand-500/20',
    text: 'text-brand-500',
    glow: 'group-hover:shadow-brand-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-500',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-500',
    glow: 'group-hover:shadow-amber-500/20',
  },
  slate: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-500',
    glow: 'group-hover:shadow-slate-500/20',
  },
};

export function MiniStat({ title, value, icon: Icon, color = 'brand', className }: MiniStatProps) {
  const styles = colorStyles[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={cn(
        'relative p-5 rounded-2xl',
        'bg-surface border border-border',
        'group transition-all duration-300',
        'hover:shadow-lg',
        styles.glow,
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', styles.bg, styles.text)}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1">
            {title}
          </p>
          <AnimatedCounter
            value={value}
            className="text-2xl font-bold text-text-primary"
          />
        </div>
      </div>
    </motion.div>
  );
}

export default HeroStat;
