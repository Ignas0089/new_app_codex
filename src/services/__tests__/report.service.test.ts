import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getBudgetVsActual, getSpendByCategory, getTrendOverTime } from '../report';
import type { ExpenseRecord } from '@db/db';
import { createMockDatabase } from '@test/utils/mockDatabase';
import type { BudgetSnapshot } from '@domain/types';
import * as budgetService from '../budget';

describe('getBudgetVsActual', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('delegates to budget snapshots service', async () => {
    const database = createMockDatabase();
    const snapshot: BudgetSnapshot = {
      categoryId: 'cat-1',
      month: '2024-05',
      limitCents: 30_000,
      actualCents: 25_000,
      availableCents: 5_000,
      carryInCents: 0,
      status: 'approaching'
    };
    const spy = vi.spyOn(budgetService, 'getBudgetSnapshots').mockResolvedValue([snapshot]);

    const result = await getBudgetVsActual('2024-05', database);

    expect(spy).toHaveBeenCalledWith('2024-05', database);
    expect(result).toEqual([snapshot]);
  });
});

describe('getSpendByCategory', () => {
  it('aggregates totals per category and sorts descending', async () => {
    const expenses: ExpenseRecord[] = [
      {
        id: 'exp-1',
        amountCents: 10_000,
        currency: 'EUR',
        date: '2024-05-01T00:00:00.000Z',
        month: '2024-05',
        categoryId: 'cat-food',
        createdAt: '2024-05-01T00:00:00.000Z',
        updatedAt: '2024-05-01T00:00:00.000Z'
      },
      {
        id: 'exp-2',
        amountCents: 5_000,
        currency: 'EUR',
        date: '2024-05-02T00:00:00.000Z',
        month: '2024-05',
        categoryId: 'cat-food',
        createdAt: '2024-05-02T00:00:00.000Z',
        updatedAt: '2024-05-02T00:00:00.000Z'
      },
      {
        id: 'exp-3',
        amountCents: 20_000,
        currency: 'EUR',
        date: '2024-05-03T00:00:00.000Z',
        month: '2024-05',
        categoryId: 'cat-rent',
        createdAt: '2024-05-03T00:00:00.000Z',
        updatedAt: '2024-05-03T00:00:00.000Z'
      }
    ];
    const database = createMockDatabase({ expenses });

    const rows = await getSpendByCategory('2024-05', database);

    expect(rows).toEqual([
      { categoryId: 'cat-rent', month: '2024-05', totalCents: 20_000 },
      { categoryId: 'cat-food', month: '2024-05', totalCents: 15_000 }
    ]);
  });
});

describe('getTrendOverTime', () => {
  it('computes totals for each month in chronological order', async () => {
    const expenses: ExpenseRecord[] = [
      {
        id: 'exp-jan',
        amountCents: 10_000,
        currency: 'EUR',
        date: '2024-01-10T00:00:00.000Z',
        month: '2024-01',
        categoryId: 'cat-1',
        createdAt: '2024-01-10T00:00:00.000Z',
        updatedAt: '2024-01-10T00:00:00.000Z'
      },
      {
        id: 'exp-feb',
        amountCents: 8_000,
        currency: 'EUR',
        date: '2024-02-05T00:00:00.000Z',
        month: '2024-02',
        categoryId: 'cat-1',
        createdAt: '2024-02-05T00:00:00.000Z',
        updatedAt: '2024-02-05T00:00:00.000Z'
      }
    ];
    const database = createMockDatabase({ expenses });

    const trend = await getTrendOverTime({ startMonth: '2024-02', monthsBack: 1 }, database);

    expect(trend).toEqual([
      { month: '2024-01', totalCents: 10_000 },
      { month: '2024-02', totalCents: 8_000 }
    ]);
  });
});
