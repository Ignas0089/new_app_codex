import type { ComponentPropsWithoutRef } from 'react';

import { formatCentsToEuro } from '@utils/money';

export type MoneyTone = 'default' | 'positive' | 'warning' | 'danger';

export interface MoneyProps extends ComponentPropsWithoutRef<'span'> {
  amountCents: number;
  showSign?: boolean;
  tone?: MoneyTone;
}

function formatEuroDisplay(amountCents: number, showSign: boolean): string {
  const value = formatCentsToEuro(Math.abs(amountCents));
  if (!showSign) {
    return value.replace('€', '€\u202f');
  }

  const sign = amountCents > 0 ? '+' : amountCents < 0 ? '−' : '';
  const normalized = value.replace('€', '€\u202f');
  return sign ? `${sign}${normalized}` : normalized;
}

export function Money({
  amountCents,
  showSign = false,
  tone = 'default',
  className,
  ...props
}: MoneyProps): JSX.Element {
  const toneClass = tone === 'default' ? '' : ` money--${tone}`;
  const classes = className ? `money${toneClass} ${className}` : `money${toneClass}`;

  return (
    <span {...props} className={classes}>
      {formatEuroDisplay(amountCents, showSign)}
    </span>
  );
}
