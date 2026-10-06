'use client';

import React, { forwardRef } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-neutral-50 hover:bg-primary-500 active:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 disabled:bg-neutral-800 disabled:text-neutral-500',
  secondary: 'bg-transparent border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-600 active:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 disabled:border-neutral-800 disabled:text-neutral-600',
  ghost: 'bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-neutral-300 active:bg-neutral-700 focus-visible:ring-1 focus-visible:ring-neutral-500 disabled:text-neutral-600',
  danger: 'bg-error-500/10 border border-error-500/30 text-error-400 hover:bg-error-500/20 active:bg-error-500/30 focus-visible:ring-2 focus-visible:ring-error-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900 disabled:bg-transparent disabled:text-neutral-600 disabled:border-neutral-800',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    iconPosition = 'left',
    children,
    disabled,
    className = '',
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-150 focus-visible:outline-none',
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!isLoading && icon && iconPosition === 'left' && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

// ─── Icon button (compact) ────────────────────────────────────────────────────

interface IconButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon: React.ReactNode;
  ariaLabel: string;
}

export function IconButton({ icon, ariaLabel, ...rest }: IconButtonProps) {
  return (
    <button
      className="h-9 w-9 flex items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-900"
      aria-label={ariaLabel}
      {...rest}
    >
      {icon}
    </button>
  );
}
