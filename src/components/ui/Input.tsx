import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      icon,
      iconPosition = 'left',
      fullWidth = true,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              // Base styles
              'w-full rounded-xl border bg-surface px-4 py-3',
              'text-sm font-medium text-text-primary placeholder:text-text-tertiary',
              'transition-all duration-fast',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
              'focus:bg-surface',
              // Default border
              !hasError && 'border-border hover:border-border-strong',
              // Error state
              hasError && 'border-error focus:ring-error/50 focus:border-error',
              // Dark mode
              'dark:bg-surface-elevated dark:hover:bg-surface-overlay dark:focus:bg-surface-overlay',
              // Icon padding
              icon && iconPosition === 'left' && 'pl-10',
              icon && iconPosition === 'right' && 'pr-10',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-subtle',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
            }
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea variant
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, fullWidth = true, className, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles
            'w-full rounded-xl border bg-surface px-4 py-3',
            'text-sm font-medium text-text-primary placeholder:text-text-tertiary',
            'transition-all duration-fast resize-none',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            'focus:bg-surface',
            // Default border
            !hasError && 'border-border hover:border-border-strong',
            // Error state
            hasError && 'border-error focus:ring-error/50 focus:border-error',
            // Dark mode
            'dark:bg-surface-elevated dark:hover:bg-surface-overlay dark:focus:bg-surface-overlay',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-background-subtle',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select variant
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  fullWidth?: boolean;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, fullWidth = true, options, className, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const hasError = !!error;

    return (
      <div className={cn('space-y-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            // Base styles
            'w-full rounded-xl border bg-surface px-4 py-3',
            'text-sm font-medium text-text-primary',
            'transition-all duration-fast appearance-none cursor-pointer',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
            // Default border
            !hasError && 'border-border hover:border-border-strong',
            // Error state
            hasError && 'border-error focus:ring-error/50 focus:border-error',
            // Dark mode
            'dark:bg-surface-elevated dark:hover:bg-surface-overlay',
            // Custom arrow
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2394a3b8\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem_1.25rem] pr-10',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          aria-invalid={hasError}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-error"
            role="alert"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
