import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';

// Toast types
type ToastType = 'success' | 'error' | 'info' | 'warning' | 'whatsapp';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  whatsapp: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 300;

// Icons for each toast type
const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
  whatsapp: MessageCircle,
};

// Styles for each toast type
const toastStyles = {
  success: {
    container: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-900 dark:text-emerald-100',
    description: 'text-emerald-700 dark:text-emerald-300',
  },
  error: {
    container: 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800/50',
    icon: 'text-red-600 dark:text-red-400',
    title: 'text-red-900 dark:text-red-100',
    description: 'text-red-700 dark:text-red-300',
  },
  info: {
    container: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/50',
    icon: 'text-blue-600 dark:text-blue-400',
    title: 'text-blue-900 dark:text-blue-100',
    description: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    container: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/50',
    icon: 'text-amber-600 dark:text-amber-400',
    title: 'text-amber-900 dark:text-amber-100',
    description: 'text-amber-700 dark:text-amber-300',
  },
  whatsapp: {
    container: 'bg-emerald-50 dark:bg-emerald-950/50 border-whatsapp/30 dark:border-whatsapp/20',
    icon: 'text-whatsapp',
    title: 'text-emerald-900 dark:text-emerald-100',
    description: 'text-emerald-700 dark:text-emerald-300',
  },
};

// Animation variants
const toastVariants = {
  initial: {
    opacity: 0,
    y: -20,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    }
  },
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const dismiss = useCallback((id: string) => {
    // Clear any existing timeout
    const timeout = toastTimeouts.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      toastTimeouts.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    // Clear all timeouts
    toastTimeouts.current.forEach((timeout) => clearTimeout(timeout));
    toastTimeouts.current.clear();
    setToasts([]);
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = generateId();
    const duration = options.duration ?? 5000;

    setToasts((prev) => {
      // Remove oldest if at limit
      const updated = prev.length >= TOAST_LIMIT
        ? [...prev.slice(1), { ...options, id }]
        : [...prev, { ...options, id }];
      return updated;
    });

    // Auto dismiss
    if (duration > 0) {
      const timeout = setTimeout(() => {
        dismiss(id);
      }, duration);
      toastTimeouts.current.set(id, timeout);
    }

    return id;
  }, [dismiss]);

  // Convenience methods
  const success = useCallback((title: string, description?: string) => {
    return toast({ type: 'success', title, description });
  }, [toast]);

  const error = useCallback((title: string, description?: string) => {
    return toast({ type: 'error', title, description, duration: 7000 }); // Errors stay longer
  }, [toast]);

  const info = useCallback((title: string, description?: string) => {
    return toast({ type: 'info', title, description });
  }, [toast]);

  const warning = useCallback((title: string, description?: string) => {
    return toast({ type: 'warning', title, description, duration: 6000 });
  }, [toast]);

  const whatsapp = useCallback((title: string, description?: string) => {
    return toast({ type: 'whatsapp', title, description });
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, info, warning, whatsapp, dismiss, dismissAll }}>
      {children}

      {/* Toast Container */}
      <div
        className="fixed top-4 right-4 z-[1600] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const Icon = toastIcons[t.type];
            const styles = toastStyles[t.type];

            return (
              <motion.div
                key={t.id}
                layout
                variants={toastVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={cn(
                  'pointer-events-auto',
                  'flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
                  styles.container
                )}
                role="alert"
              >
                {/* Icon */}
                <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm', styles.title)}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className={cn('text-sm mt-1', styles.description)}>
                      {t.description}
                    </p>
                  )}
                  {t.action && (
                    <button
                      onClick={() => {
                        t.action?.onClick();
                        dismiss(t.id);
                      }}
                      className={cn(
                        'mt-2 text-sm font-semibold underline underline-offset-2',
                        styles.icon
                      )}
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>

                {/* Dismiss button */}
                <button
                  onClick={() => dismiss(t.id)}
                  className={cn(
                    'flex-shrink-0 p-1.5 rounded-lg transition-colors',
                    'hover:bg-black/5 dark:hover:bg-white/5',
                    styles.icon
                  )}
                  aria-label="Dismiss notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { ToastContext };
