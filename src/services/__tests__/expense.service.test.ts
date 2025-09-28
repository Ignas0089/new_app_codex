import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createExpense,
  deleteExpense,
  getExpenseById,
  listExpenses,
  updateExpense
} from '../expense';
import type { ExpenseRecord } from '@db/db';
import { createMockDatabase } from '@test/utils/mockDatabase';
import { getCurrentIsoTimestamp, getMonthKey } from '@utils/dates';

vi.mock('@utils/dates', async () => {
  const actual = await vi.importActual<typeof import('@utils/dates')>('@utils/dates');
  return {
    ...actual,
    getCurrentIsoTimestamp: vi.fn(() => '2024-05-01T00:00:00.000Z')
  };
});

const groceryExpense: ExpenseRecord = {
  id: 'exp-1',
  amountCents: 3_500,
  currency: 'EUR',
  date: '2024-05-10T00:00:00.000Z',
  month: '2024-05',
  categoryId: 'groceries',
  note: 'fresh food',
  createdAt: '2024-05-10T00:00:00.000Z',
  updatedAt: '2024-05-10T00:00:00.000Z'
};

const travelExpense: ExpenseRecord = {
  id: 'exp-2',
  amountCents: 20_000,
  currency: 'EUR',
  date: '2024-04-03T00:00:00.000Z',
  month: '2024-04',
  categoryId: 'travel',
  note: 'flights',
  createdAt: '2024-04-03T00:00:00.000Z',
  updatedAt: '2024-04-03T00:00:00.000Z'
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-01T00:00:00.000Z');
});

describe('listExpenses', () => {
  it('filters by month, category, search and applies ordering with optional limit', async () => {
    const database = createMockDatabase({ expenses: [groceryExpense, travelExpense] });

    const result = await listExpenses(
      {
        month: '2024-05',
        categoryId: 'groceries',
        search: 'FOOD',
        order: 'asc'
      },
      database
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'exp-1' });

    const limited = await listExpenses({ limit: 1 }, database);
    expect(limited).toHaveLength(1);
    expect(limited[0].id).toBe('exp-1');
  });
});

describe('getExpenseById', () => {
  it('returns parsed expense or null', async () => {
    const database = createMockDatabase({ expenses: [groceryExpense] });

    await expect(getExpenseById('exp-1', database)).resolves.toMatchObject({ id: 'exp-1' });
    await expect(getExpenseById('missing', database)).resolves.toBeNull();
  });
});

describe('createExpense', () => {
  it('derives month from date when missing and persists record', async () => {
    const database = createMockDatabase();
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-15T00:00:00.000Z');

    const created = await createExpense(
      {
        amountCents: 1_500,
        date: '2024-05-05T00:00:00.000Z',
        categoryId: 'groceries'
      },
      database
    );

    expect(created).toMatchObject({
      id: 'generated-id',
      month: getMonthKey('2024-05-05T00:00:00.000Z'),
      createdAt: '2024-05-15T00:00:00.000Z',
      updatedAt: '2024-05-15T00:00:00.000Z'
    });
  });
});

describe('updateExpense', () => {
  it('recalculates month when date changes', async () => {
    const database = createMockDatabase({ expenses: [groceryExpense] });
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-20T00:00:00.000Z');

    const updated = await updateExpense(
      'exp-1',
      {
        date: '2024-06-01T00:00:00.000Z'
      },
      database
    );

    expect(updated).toMatchObject({
      month: '2024-06',
      updatedAt: '2024-05-20T00:00:00.000Z'
    });
  });

  it('throws when expense is missing', async () => {
    const database = createMockDatabase();
    await expect(updateExpense('missing', { amountCents: 1000 }, database)).rejects.toThrowError(
      'Expense missing not found'
    );
  });
});

describe('deleteExpense', () => {
  it('removes record by id', async () => {
    const database = createMockDatabase({ expenses: [groceryExpense] });

    await deleteExpense('exp-1', database);

    await expect(listExpenses({}, database)).resolves.toHaveLength(0);
  });
});
