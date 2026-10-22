import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'grid size-10 place-items-center rounded-md text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink',
        className,
      )}
    >
      {isDark ? <Sun aria-hidden className="size-4.5" /> : <Moon aria-hidden className="size-4.5" />}
    </button>
  );
}
