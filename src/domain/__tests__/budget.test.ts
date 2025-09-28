import { describe, expect, it } from 'vitest';

import { calculateBudgetSnapshot } from '../budget';
import type { Budget } from '../types';

const baseBudget: Budget = {
  id: 'b1',
  month: '2024-05',
  categoryId: 'cat-1',
  limitCents: 50000,
  carryOverPrev: false,
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-01T00:00:00.000Z'
};

const previousBudget: Budget = {
  ...baseBudget,
  id: 'b0',
  month: '2024-04',
  carryOverPrev: true,
  limitCents: 60000
};

describe('calculateBudgetSnapshot', () => {
  it('marks status ok when spend is below threshold', () => {
    const snapshot = calculateBudgetSnapshot({
      budget: baseBudget,
      actualCents: 20000
    });

    expect(snapshot.status).toBe('ok');
    expect(snapshot.availableCents).toBe(30000);
  });

  it('marks status approaching when spend is above 80% but below limit', () => {
    const snapshot = calculateBudgetSnapshot({
      budget: baseBudget,
      actualCents: 42000
    });

    expect(snapshot.status).toBe('approaching');
    expect(snapshot.availableCents).toBe(8000);
  });

  it('marks status over when spend meets or exceeds limit', () => {
    const snapshot = calculateBudgetSnapshot({
      budget: baseBudget,
      actualCents: 52000
    });

    expect(snapshot.status).toBe('over');
    expect(snapshot.availableCents).toBe(-2000);
  });

  it('carries unspent funds from previous month when enabled', () => {
    const snapshot = calculateBudgetSnapshot({
      budget: { ...baseBudget, carryOverPrev: true },
      actualCents: 30000,
      previousBudget,
      previousActualCents: 40000
    });

    expect(snapshot.carryInCents).toBe(20000);
    expect(snapshot.availableCents).toBe(40000);
    expect(snapshot.status).toBe('ok');
  });

  it('ignores carry-over when previous budget is missing', () => {
    const snapshot = calculateBudgetSnapshot({
      budget: { ...baseBudget, carryOverPrev: true },
      actualCents: 10000,
      previousBudget: null,
      previousActualCents: 5000
    });

    expect(snapshot.carryInCents).toBe(0);
  });
});
