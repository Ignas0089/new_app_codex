import { describe, expect, it } from 'vitest';

import { addCents, clampCents, formatCentsToEuro, parseEuroToCents } from '../money';

describe('money utilities', () => {
  it('parses numeric euro strings into cents', () => {
    expect(parseEuroToCents('12.34')).toBe(1234);
    expect(parseEuroToCents('99,99')).toBe(9999);
    expect(parseEuroToCents(12)).toBe(1200);
  });

  it('throws for invalid input', () => {
    expect(() => parseEuroToCents('abc')).toThrowError();
  });

  it('formats cents as euro currency', () => {
    expect(formatCentsToEuro(1234)).toBe('€12.34');
  });

  it('adds cent amounts precisely', () => {
    expect(addCents([100, 200, 50])).toBe(350);
  });

  it('clamps values within bounds', () => {
    expect(clampCents(-100)).toBe(0);
    expect(clampCents(500, { min: 100, max: 400 })).toBe(400);
  });
});
