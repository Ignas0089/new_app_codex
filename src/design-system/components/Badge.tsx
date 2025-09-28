import { HTMLAttributes } from 'react';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

const join = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ');

export function Badge({ tone = 'neutral', size = 'md', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={join('ds-badge', `ds-badge--${tone}`, `ds-badge--${size}`, className)}
      {...rest}
    >
      {children}
    </span>
  );
}
