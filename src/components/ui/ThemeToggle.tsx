import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../providers/ThemeProvider';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'default' | 'compact';
}

export function ThemeToggle({ className, showLabel = false, variant = 'default' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const Icon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;
  const label = theme === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Dark' : 'Light';

  if (variant === 'compact') {
    return (
      <motion.button
        onClick={toggleTheme}
        className={cn(
          'p-2 rounded-xl transition-colors',
          'text-text-secondary hover:text-text-primary',
          'hover:bg-background-subtle dark:hover:bg-surface-elevated',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ y: -10, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 10, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl transition-colors',
        'text-text-secondary hover:text-text-primary',
        'hover:bg-background-subtle dark:hover:bg-surface-elevated',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        className
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode`}
    >
      <div className="relative w-5 h-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Icon className="w-5 h-5" />
          </motion.div>
        </AnimatePresence>
      </div>
      {showLabel && (
        <span className="text-sm font-medium">{label}</span>
      )}
    </motion.button>
  );
}

// Three-way toggle variant
interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl',
        'bg-background-subtle dark:bg-surface-elevated',
        'border border-border-subtle',
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map(({ value, icon: Icon, label }) => (
        <motion.button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'transition-colors duration-fast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
            theme === value
              ? 'text-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          whileTap={{ scale: 0.95 }}
        >
          {theme === value && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 bg-surface dark:bg-surface-overlay rounded-lg shadow-sm"
              transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            />
          )}
          <Icon className="relative z-10 w-4 h-4" />
          <span className="relative z-10 hidden sm:inline">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}

export default ThemeToggle;
