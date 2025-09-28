import { describe, expect, it } from 'vitest';

import { buildBudgetSnapshots } from '../budget';
import type { Budget, Expense } from '@domain/types';

const aprilBudget: Budget = {
  id: 'budget-apr',
  month: '2024-04',
  categoryId: 'cat-1',
  limitCents: 40000,
  carryOverPrev: false,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z'
};

const mayBudget: Budget = {
  id: 'budget-may',
  month: '2024-05',
  categoryId: 'cat-1',
  limitCents: 30000,
  carryOverPrev: true,
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-01T00:00:00.000Z'
};

const aprilExpense: Expense = {
  id: 'exp-apr',
  amountCents: 25000,
  currency: 'EUR',
  date: '2024-04-10T00:00:00.000Z',
  month: '2024-04',
  categoryId: 'cat-1',
  note: 'Groceries',
  createdAt: '2024-04-10T00:00:00.000Z',
  updatedAt: '2024-04-10T00:00:00.000Z'
};

const mayExpense: Expense = {
  id: 'exp-may',
  amountCents: 35000,
  currency: 'EUR',
  date: '2024-05-12T00:00:00.000Z',
  month: '2024-05',
  categoryId: 'cat-1',
  note: 'Rent',
  createdAt: '2024-05-12T00:00:00.000Z',
  updatedAt: '2024-05-12T00:00:00.000Z'
};

describe('buildBudgetSnapshots', () => {
  it('computes carry-over and status', () => {
    const [snapshot] = buildBudgetSnapshots({
      month: '2024-05',
      budgets: [mayBudget],
      expenses: [mayExpense],
      previousBudgets: [aprilBudget],
      previousExpenses: [aprilExpense]
    });

    expect(snapshot.carryInCents).toBe(15000);
    expect(snapshot.actualCents).toBe(35000);
    expect(snapshot.availableCents).toBe(10000);
    expect(snapshot.status).toBe('approaching');
  });
});
