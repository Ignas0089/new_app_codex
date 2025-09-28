import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  setCategoryHidden,
  updateCategory
} from '../category';
import type { CategoryRecord, ExpenseRecord } from '@db/db';
import { createMockDatabase } from '@test/utils/mockDatabase';
import { getCurrentIsoTimestamp } from '@utils/dates';

vi.mock('@utils/dates', async () => {
  const actual = await vi.importActual<typeof import('@utils/dates')>('@utils/dates');
  return {
    ...actual,
    getCurrentIsoTimestamp: vi.fn(() => '2024-05-01T00:00:00.000Z')
  };
});

const foodCategory: CategoryRecord = {
  id: 'cat-food',
  name: 'Food',
  color: '#ff6600',
  isHidden: false,
  createdAt: '2024-04-01T00:00:00.000Z',
  updatedAt: '2024-04-01T00:00:00.000Z'
};

const travelCategory: CategoryRecord = {
  id: 'cat-travel',
  name: 'Travel',
  color: '#0033ff',
  isHidden: true,
  createdAt: '2024-04-05T00:00:00.000Z',
  updatedAt: '2024-04-05T00:00:00.000Z'
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-01T00:00:00.000Z');
});

describe('listCategories', () => {
  it('sorts alphabetically and hides hidden categories by default', async () => {
    const database = createMockDatabase({ categories: [travelCategory, foodCategory] });

    const result = await listCategories({}, database);

    expect(result).toEqual([
      expect.objectContaining({ id: 'cat-food' })
    ]);
  });

  it('includes hidden categories when requested', async () => {
    const database = createMockDatabase({ categories: [travelCategory, foodCategory] });

    const result = await listCategories({ includeHidden: true }, database);

    expect(result.map((category) => category.id)).toEqual(['cat-food', 'cat-travel']);
  });
});

describe('getCategoryById', () => {
  it('returns parsed category or null', async () => {
    const database = createMockDatabase({ categories: [foodCategory] });

    await expect(getCategoryById('cat-food', database)).resolves.toMatchObject({ id: 'cat-food' });
    await expect(getCategoryById('missing', database)).resolves.toBeNull();
  });
});

describe('createCategory', () => {
  it('trims name, applies defaults and persists record', async () => {
    const database = createMockDatabase();
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-10T00:00:00.000Z');

    const created = await createCategory(
      {
        name: '  Utilities  ',
        color: '#00ff00'
      },
      database
    );

    expect(created).toMatchObject({
      id: 'generated-id',
      name: 'Utilities',
      isHidden: false,
      createdAt: '2024-05-10T00:00:00.000Z',
      updatedAt: '2024-05-10T00:00:00.000Z'
    });
  });
});

describe('updateCategory', () => {
  it('updates existing category and normalises nullable color', async () => {
    const database = createMockDatabase({ categories: [foodCategory] });
    vi.mocked(getCurrentIsoTimestamp).mockReturnValue('2024-05-20T00:00:00.000Z');

    const updated = await updateCategory(
      'cat-food',
      {
        name: 'Groceries',
        color: null
      },
      database
    );

    expect(updated).toMatchObject({
      name: 'Groceries',
      color: undefined,
      updatedAt: '2024-05-20T00:00:00.000Z'
    });
  });

  it('throws when category does not exist', async () => {
    const database = createMockDatabase();
    await expect(updateCategory('missing', { name: 'Anything' }, database)).rejects.toThrowError(
      'Category missing not found'
    );
  });
});

describe('setCategoryHidden', () => {
  it('delegates to updateCategory', async () => {
    const database = createMockDatabase({ categories: [foodCategory] });

    const updated = await setCategoryHidden('cat-food', true, database);

    expect(updated.isHidden).toBe(true);
  });
});

describe('deleteCategory', () => {
  it('prevents deletion when expenses exist for category', async () => {
    const expense: ExpenseRecord = {
      id: 'exp-1',
      amountCents: 1_000,
      currency: 'EUR',
      date: '2024-05-01T00:00:00.000Z',
      month: '2024-05',
      categoryId: 'cat-food',
      createdAt: '2024-05-01T00:00:00.000Z',
      updatedAt: '2024-05-01T00:00:00.000Z'
    };
    const database = createMockDatabase({ categories: [foodCategory], expenses: [expense] });

    await expect(deleteCategory('cat-food', database)).rejects.toThrowError(
      'Cannot delete category that has associated expenses. Consider hiding it instead.'
    );
  });

  it('deletes category when not used', async () => {
    const database = createMockDatabase({ categories: [foodCategory] });

    await deleteCategory('cat-food', database);

    await expect(listCategories({ includeHidden: true }, database)).resolves.toHaveLength(0);
  });
});
