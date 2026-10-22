interface StepLegendProps {
  step: number;
  title: string;
  aside?: string;
}

export function StepLegend({ step, title, aside }: StepLegendProps) {
  return (
    <span className="flex items-baseline gap-3">
      <span aria-hidden className="tabular text-sm font-semibold text-accent">
        {String(step).padStart(2, '0')}
      </span>
      <span className="font-display text-xl font-semibold tracking-tight">{title}</span>
      {aside && <span className="ml-auto text-xs text-muted">{aside}</span>}
    </span>
  );
}
