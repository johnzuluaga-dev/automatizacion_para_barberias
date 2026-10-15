import { useCallback, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastContext, type ToastInput, type ToastItem, type ToastTone } from './toast-context';

const DURATION_MS = 4500;

const icons: Record<ToastTone, typeof Info> = {
  success: CircleCheck,
  danger: CircleAlert,
  info: Info,
};

const iconColor: Record<ToastTone, string> = {
  success: 'text-success-text',
  danger: 'text-danger-text',
  info: 'text-info-text',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    ({ tone = 'info', title, description }: ToastInput) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-2), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = icons[toast.tone];
            return (
              <m.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                role={toast.tone === 'danger' ? 'alert' : 'status'}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-line bg-surface p-4 text-sm shadow-lg"
              >
                <Icon aria-hidden className={cn('mt-0.5 size-4.5 shrink-0', iconColor[toast.tone])} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{toast.title}</p>
                  {toast.description && <p className="mt-0.5 text-muted">{toast.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Cerrar notificación"
                  className="-m-1 grid size-7 place-items-center rounded-sm text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
