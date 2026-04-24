import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <section
      className={[
        'rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-sm',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </section>
  );
}
