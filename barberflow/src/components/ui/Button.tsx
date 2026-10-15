import type { ComponentProps, ReactNode } from 'react';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './button-styles';
import { Spinner } from './Spinner';

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Texto mostrado mientras `loading` es true. */
  loadingText?: string;
  icon?: ReactNode;
}

export function Button({
  variant,
  size,
  loading = false,
  loadingText,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
