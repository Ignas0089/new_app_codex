const EURO_FORMATTER = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function parseEuroToCents(value: number | string): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value * 100);
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[^0-9,.-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(sanitized);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid currency input: ${value}`);
    }
    return Math.round(parsed * 100);
  }

  throw new Error('Unsupported currency value');
}

export function formatCentsToEuro(amountCents: number): string {
  return EURO_FORMATTER.format(amountCents / 100);
}

export function addCents(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

export function clampCents(value: number, { min = 0, max }: { min?: number; max?: number } = {}): number {
  let result = value;
  if (min !== undefined) {
    result = Math.max(result, min);
  }
  if (max !== undefined) {
    result = Math.min(result, max);
  }
  return result;
}
