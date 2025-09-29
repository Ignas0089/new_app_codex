import { describe, expect, it } from 'vitest';

import type { ExpenseRecord } from '@db/db';
import { listExpenses, type ExpenseFilters } from '../expense';

class FakeCollection {
  constructor(private readonly records: ExpenseRecord[]) {}

  and(predicate: (expense: ExpenseRecord) => boolean): FakeCollection {
    return new FakeCollection(this.records.filter(predicate));
  }

  async toArray(): Promise<ExpenseRecord[]> {
    return [...this.records];
  }
}

class FakeExpenseTable {
  constructor(private readonly records: ExpenseRecord[]) {}

  where(field: string): { equals: (value: string) => FakeCollection } {
    if (field !== 'month') {
      throw new Error(`Unsupported where field: ${field}`);
    }
    return {
      equals: (value: string) =>
        new FakeCollection(this.records.filter((record) => record.month === value))
    };
  }

  toCollection(): FakeCollection {
    return new FakeCollection([...this.records]);
  }
}

function listWithFilters(records: ExpenseRecord[], filters: ExpenseFilters): Promise<any> {
  const table = new FakeExpenseTable(records);
  return listExpenses(filters, { expenses: table } as any);
}

describe('listExpenses', () => {
  const baseRecords: ExpenseRecord[] = [
    {
      id: 'exp-1',
      amountCents: 1200,
      currency: 'EUR',
      date: '2024-05-15T10:00:00.000Z',
      month: '2024-05',
      categoryId: 'cat-food',
      note: 'Groceries and milk',
      createdAt: '2024-05-15T10:00:00.000Z',
      updatedAt: '2024-05-15T10:00:00.000Z'
    },
    {
      id: 'exp-2',
      amountCents: 2500,
      currency: 'EUR',
      date: '2024-05-10T09:00:00.000Z',
      month: '2024-05',
      categoryId: 'cat-transport',
      note: 'Bus pass',
      createdAt: '2024-05-10T09:00:00.000Z',
      updatedAt: '2024-05-10T09:00:00.000Z'
    },
    {
      id: 'exp-3',
      amountCents: 5400,
      currency: 'EUR',
      date: '2024-04-28T12:00:00.000Z',
      month: '2024-04',
      categoryId: 'cat-food',
      note: 'Groceries for week',
      createdAt: '2024-04-28T12:00:00.000Z',
      updatedAt: '2024-04-28T12:00:00.000Z'
    },
    {
      id: 'exp-4',
      amountCents: 900,
      currency: 'EUR',
      date: '2024-05-20T18:00:00.000Z',
      month: '2024-05',
      categoryId: 'cat-food',
      note: 'Milk and bread',
      createdAt: '2024-05-20T18:00:00.000Z',
      updatedAt: '2024-05-20T18:00:00.000Z'
    }
  ];

  it('filters by month, category, and search term while sorting newest first by default', async () => {
    const expenses = await listWithFilters(baseRecords, {
      month: '2024-05',
      categoryId: 'cat-food',
      search: 'MILK'
    });

    expect(expenses).toHaveLength(2);
    expect(expenses.map((expense: any) => expense.id)).toEqual(['exp-4', 'exp-1']);
  });

  it('respects explicit ordering and limit options', async () => {
    const expenses = await listWithFilters(baseRecords, {
      month: '2024-05',
      order: 'asc',
      limit: 2
    });

    expect(expenses).toHaveLength(2);
    expect(expenses.map((expense: any) => expense.id)).toEqual(['exp-2', 'exp-1']);
  });
});
