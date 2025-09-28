import { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'sm' | 'md';
}

const join = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ');

export function Card({
  header,
  footer,
  children,
  className,
  padding = 'md',
  elevation = 'sm',
  ...rest
}: CardProps) {
  return (
    <div
      className={join('ds-card', `ds-card--padding-${padding}`, `ds-card--elevation-${elevation}`, className)}
      {...rest}
    >
      {header ? <div className="ds-card__header">{header}</div> : null}
      <div className="ds-card__body">{children}</div>
      {footer ? <div className="ds-card__footer">{footer}</div> : null}
    </div>
  );
}
