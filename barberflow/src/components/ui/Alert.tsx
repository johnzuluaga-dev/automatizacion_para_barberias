import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertTone = 'danger' | 'success' | 'info';

const tones: Record<AlertTone, { box: string; Icon: typeof Info }> = {
  danger: { box: 'border-danger/25 bg-danger-soft text-danger', Icon: CircleAlert },
  success: { box: 'border-success/25 bg-success-soft text-success', Icon: CircleCheck },
  info: { box: 'border-info/25 bg-info-soft text-info', Icon: Info },
};

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-sm', box, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={cn(title && 'mt-0.5', 'break-words')}>{children}</div>
      </div>
      {action}
    </div>
  );
}
