import type { HTMLAttributes, ReactNode } from 'react';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border-white/15 bg-white/5 text-white',
  success: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-100',
  warning: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
  danger: 'border-red-500/30 bg-red-500/15 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/15 text-sky-100',
};

export function Badge({ tone = 'neutral', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        toneClasses[tone],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
