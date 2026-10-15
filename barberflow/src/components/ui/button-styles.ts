import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-55 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-ink shadow-sm hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:border-ink/40 hover:bg-surface-2',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger-text text-white shadow-sm hover:brightness-95 dark:text-bg',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 rounded-sm px-3 text-sm',
  md: 'h-11 rounded-md px-4 text-sm',
  lg: 'h-13 rounded-md px-6 text-base',
};

/** Clases de botón reutilizables también en enlaces (`<Link className={buttonStyles()} />`). */
export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}
