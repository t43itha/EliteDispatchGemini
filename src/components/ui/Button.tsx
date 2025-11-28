import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'whatsapp' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-brand-600 text-white',
    'hover:bg-brand-700 active:bg-brand-800',
    'shadow-md hover:shadow-lg hover:shadow-brand-500/20',
    'dark:bg-brand-500 dark:hover:bg-brand-600',
    'disabled:bg-brand-300 dark:disabled:bg-brand-800'
  ),
  secondary: cn(
    'bg-surface text-text-primary border border-border',
    'hover:bg-background-subtle hover:border-border-strong',
    'shadow-sm hover:shadow-md',
    'dark:bg-surface-elevated dark:hover:bg-surface-overlay'
  ),
  ghost: cn(
    'bg-transparent text-text-secondary',
    'hover:bg-background-subtle hover:text-text-primary',
    'dark:hover:bg-surface-elevated'
  ),
  danger: cn(
    'bg-error text-white',
    'hover:bg-red-600 active:bg-red-700',
    'shadow-md hover:shadow-lg hover:shadow-error/20',
    'disabled:bg-red-300'
  ),
  whatsapp: cn(
    'bg-whatsapp text-white',
    'hover:bg-whatsapp-600 active:bg-whatsapp-700',
    'shadow-md hover:shadow-lg hover:shadow-whatsapp/30',
    'disabled:bg-whatsapp-300'
  ),
  outline: cn(
    'bg-transparent text-brand-600 border-2 border-brand-600',
    'hover:bg-brand-50 dark:hover:bg-brand-950',
    'dark:text-brand-400 dark:border-brand-400'
  ),
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2.5',
  icon: 'h-10 w-10 rounded-xl p-0 justify-center',
};

// Magnetic hover effect values
const magneticStrength = 0.1;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      className,
      onMouseMove,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => buttonRef.current!);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!buttonRef.current || disabled) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * magneticStrength;
      const y = (e.clientY - rect.top - rect.height / 2) * magneticStrength;
      setPosition({ x, y });

      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setPosition({ x: 0, y: 0 });
      onMouseLeave?.(e);
    };

    const isDisabled = disabled || loading;
    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

    return (
      <motion.button
        ref={buttonRef}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center font-semibold',
          'transition-colors duration-fast',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          // Variant and size
          variants[variant],
          sizes[size],
          // Full width
          fullWidth && 'w-full',
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          x: position.x,
          y: position.y,
        }}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <Loader2
            className="animate-spin absolute"
            size={iconSize}
          />
        )}

        {/* Content wrapper - hidden when loading */}
        <span
          className={cn(
            'inline-flex items-center gap-inherit',
            loading && 'invisible'
          )}
        >
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Icon button variant
interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition' | 'children'> {
  'aria-label': string;
  children: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
