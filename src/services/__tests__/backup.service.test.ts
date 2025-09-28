import { beforeEach, describe, expect, it, vi } from 'vitest';

import { clearAllData, exportBackup, importBackup } from '../backup';
import type { BudgetRecord, CategoryRecord, ExpenseRecord, SettingRecord } from '@db/db';
import { createMockDatabase } from '@test/utils/mockDatabase';
import { getCurrentIsoTimestamp } from '@utils/dates';

vi.mock('@utils/dates', async () => {
  const actual = await vi.importActual<typeof import('@utils/dates')>('@utils/dates');
  return {
    ...actual,
    getCurrentIsoTimestamp: vi.fn(() => '2024-05-01T00:00:00.000Z')
  };
});

const category: CategoryRecord = {
  id: 'cat-1',
  name: 'Food',
  color: '#ff0000',
  isHidden: false,
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-01T00:00:00.000Z'
};

const budget: BudgetRecord = {
  id: 'budget-1',
  month: '2024-05',
  categoryId: 'cat-1',
  limitCents: 30_000,
  carryOverPrev: false,
  createdAt: '2024-05-01T00:00:00.000Z',
  updatedAt: '2024-05-01T00:00:00.000Z'
};

const expense: ExpenseRecord = {
  id: 'exp-1',
  amountCents: 12_000,
  currency: 'EUR',
  date: '2024-05-02T00:00:00.000Z',
  month: '2024-05',
  categoryId: 'cat-1',
  createdAt: '2024-05-02T00:00:00.000Z',
  updatedAt: '2024-05-02T00:00:00.000Z'
};

const settings: SettingRecord[] = [
  { key: 'currency', value: 'EUR' },
  { key: 'theme', value: 'dark' }
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-01T00:00:00.000Z');
});

describe('exportBackup', () => {
  it('returns validated payload with timestamp', async () => {
    const database = createMockDatabase({
      categories: [category],
      budgets: [budget],
      expenses: [expense],
      settings
    });
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-30T12:00:00.000Z');

    const payload = await exportBackup(database);

    expect(payload).toMatchObject({
      version: 1,
      exportedAt: '2024-05-30T12:00:00.000Z',
      categories: [expect.objectContaining({ id: 'cat-1' })],
      budgets: [expect.objectContaining({ id: 'budget-1' })],
      expenses: [expect.objectContaining({ id: 'exp-1' })],
      settings: expect.arrayContaining([expect.objectContaining({ key: 'currency' })])
    });
  });
});

describe('clearAllData', () => {
  it('clears tables except settings when requested', async () => {
    const database = createMockDatabase({
      categories: [category],
      budgets: [budget],
      expenses: [expense],
      settings
    });

    await clearAllData(database, { keepSettings: true });

    expect(await database.categories.toArray()).toHaveLength(0);
    expect(await database.settings.toArray()).toHaveLength(settings.length);
  });
});

describe('importBackup', () => {
  const payload = {
    version: 1,
    exportedAt: '2024-05-15T00:00:00.000Z',
    categories: [category],
    budgets: [budget],
    expenses: [expense],
    settings
  };

  it('replaces existing data when merge is false', async () => {
    const database = createMockDatabase({
      categories: [
        { ...category, id: 'legacy', name: 'Legacy', createdAt: '2024-04-01T00:00:00.000Z', updatedAt: '2024-04-01T00:00:00.000Z' }
      ],
      budgets: [],
      expenses: [],
      settings: [{ key: 'theme', value: 'light' }]
    });

    await importBackup(payload, { keepExistingSettings: true }, database);

    expect(await database.categories.toArray()).toHaveLength(1);
    expect(await database.settings.toArray()).toEqual(settings);
  });

  it('merges by removing duplicates before inserting', async () => {
    const database = createMockDatabase({ categories: [category], budgets: [budget], expenses: [expense], settings });

    await importBackup(payload, { merge: true }, database);

    expect(await database.categories.toArray()).toHaveLength(1);
    expect(await database.expenses.toArray()).toHaveLength(1);
    expect(await database.settings.toArray()).toEqual(settings);
  });
});
