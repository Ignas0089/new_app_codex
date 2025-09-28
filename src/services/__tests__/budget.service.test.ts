import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildBudgetSnapshots,
  createBudget,
  deleteBudget,
  getBudgetById,
  getBudgetSnapshots,
  listBudgets,
  updateBudget
} from '../budget';
import type { BudgetRecord, ExpenseRecord } from '@db/db';
import * as budgetDomain from '@domain/budget';
import { createMockDatabase } from '@test/utils/mockDatabase';
import { getCurrentIsoTimestamp } from '@utils/dates';

vi.mock('@utils/dates', async () => {
  const actual = await vi.importActual<typeof import('@utils/dates')>('@utils/dates');
  return {
    ...actual,
    getCurrentIsoTimestamp: vi.fn(() => '2024-05-01T00:00:00.000Z')
  };
});

const baseBudget: BudgetRecord = {
  id: 'budget-1',
  month: '2024-05',
  categoryId: 'groceries',
  limitCents: 40000,
  carryOverPrev: false,
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-01T00:00:00.000Z'
};

const previousBudget: BudgetRecord = {
  ...baseBudget,
  id: 'budget-previous',
  month: '2024-04',
  limitCents: 30000,
  carryOverPrev: true,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z'
};

const expenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    amountCents: 12_500,
    currency: 'EUR',
    date: '2024-05-10T00:00:00.000Z',
    month: '2024-05',
    categoryId: 'groceries',
    note: 'snacks',
    createdAt: '2024-05-10T00:00:00.000Z',
    updatedAt: '2024-05-10T00:00:00.000Z'
  }
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-01T00:00:00.000Z');
});

describe('listBudgets', () => {
  it('filters by month and category when provided', async () => {
    const database = createMockDatabase({
      budgets: [
        baseBudget,
        { ...baseBudget, id: 'budget-2', month: '2024-04' },
        { ...baseBudget, id: 'budget-3', categoryId: 'rent' }
      ]
    });

    const result = await listBudgets({ month: '2024-05', categoryId: 'groceries' }, database);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'budget-1', month: '2024-05', categoryId: 'groceries' });
  });
});

describe('getBudgetById', () => {
  it('returns parsed budget or null when missing', async () => {
    const database = createMockDatabase({ budgets: [baseBudget] });

    await expect(getBudgetById('budget-1', database)).resolves.toMatchObject({ id: 'budget-1' });
    await expect(getBudgetById('missing', database)).resolves.toBeNull();
  });
});

describe('createBudget', () => {
  it('validates payload, fills defaults and persists record', async () => {
    const database = createMockDatabase();
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-06-01T00:00:00.000Z');

    const created = await createBudget(
      {
        month: '2024-06',
        categoryId: 'travel',
        limitCents: 50_000
      },
      database
    );

    expect(created).toMatchObject({
      id: 'generated-id',
      month: '2024-06',
      categoryId: 'travel',
      carryOverPrev: false,
      limitCents: 50_000,
      createdAt: '2024-06-01T00:00:00.000Z',
      updatedAt: '2024-06-01T00:00:00.000Z'
    });
  });

  it('prevents creating duplicate budgets for the same category and month', async () => {
    const database = createMockDatabase({ budgets: [baseBudget] });

    await expect(
      createBudget(
        {
          month: '2024-05',
          categoryId: 'groceries',
          limitCents: 30_000
        },
        database
      )
    ).rejects.toThrowError('Budget for this category and month already exists');
  });
});

describe('updateBudget', () => {
  it('updates persisted record with patch values', async () => {
    const database = createMockDatabase({ budgets: [baseBudget] });
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-05T12:00:00.000Z');

    const updated = await updateBudget(
      'budget-1',
      {
        limitCents: 42_000,
        carryOverPrev: true
      },
      database
    );

    expect(updated).toMatchObject({
      limitCents: 42_000,
      carryOverPrev: true,
      updatedAt: '2024-05-05T12:00:00.000Z'
    });
  });

  it('throws when the budget does not exist', async () => {
    const database = createMockDatabase();
    await expect(updateBudget('missing', { limitCents: 10_000 }, database)).rejects.toThrowError(
      'Budget missing not found'
    );
  });
});

describe('deleteBudget', () => {
  it('removes the record', async () => {
    const database = createMockDatabase({ budgets: [baseBudget] });

    await deleteBudget('budget-1', database);

    await expect(listBudgets({}, database)).resolves.toHaveLength(0);
  });
});

describe('getBudgetSnapshots', () => {
  it('combines current and previous data to build snapshots', async () => {
    const database = createMockDatabase({
      budgets: [
        { ...baseBudget, carryOverPrev: true },
        previousBudget
      ],
      expenses: [
        ...expenses,
        {
          id: 'exp-prev',
          amountCents: 10_000,
          currency: 'EUR',
          date: '2024-04-10T00:00:00.000Z',
          month: '2024-04',
          categoryId: 'groceries',
          createdAt: '2024-04-10T00:00:00.000Z',
          updatedAt: '2024-04-10T00:00:00.000Z'
        }
      ]
    });

    const snapshots = await getBudgetSnapshots('2024-05', database);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      month: '2024-05',
      actualCents: 12_500,
      carryInCents: 20_000
    });
  });
});

describe('buildBudgetSnapshots', () => {
  it('propagates previous budget information to the calculator', () => {
    const calculateSpy = vi.spyOn(budgetDomain, 'calculateBudgetSnapshot');

    const snapshots = buildBudgetSnapshots({
      month: '2024-05',
      budgets: [baseBudget],
      expenses,
      previousBudgets: [previousBudget],
      previousExpenses: [
        {
          ...expenses[0],
          id: 'exp-prev',
          month: '2024-04',
          date: '2024-04-12T00:00:00.000Z'
        }
      ]
    });

    expect(snapshots).toHaveLength(1);
    expect(calculateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ previousBudget: expect.objectContaining({ id: 'budget-previous' }) })
    );

    calculateSpy.mockRestore();
  });
});
