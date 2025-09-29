import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@services/category', () => ({
  listCategories: vi.fn()
}));

vi.mock('@services/expense', () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn()
}));

import { LogPage } from '.';
import { listCategories } from '@services/category';
import { listExpenses } from '@services/expense';
import type { Category, Expense } from '@domain/types';

const buildCategory = (overrides: Partial<Category> = {}): Category => ({
  id: overrides.id ?? 'category-1',
  name: overrides.name ?? 'Category 1',
  color: overrides.color,
  isHidden: overrides.isHidden ?? false,
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00.000Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-01T00:00:00.000Z').toISOString()
});

const buildExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: overrides.id ?? `expense-${Math.random()}`,
  amountCents: overrides.amountCents ?? 1234,
  currency: overrides.currency ?? 'EUR',
  date: overrides.date ?? new Date('2024-01-02T12:00:00.000Z').toISOString(),
  month: overrides.month ?? '2024-01',
  categoryId: overrides.categoryId ?? 'category-1',
  note: overrides.note,
  createdAt: overrides.createdAt ?? new Date('2024-01-02T12:00:00.000Z').toISOString(),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T12:00:00.000Z').toISOString()
});

const listCategoriesMock = vi.mocked(listCategories);
const listExpensesMock = vi.mocked(listExpenses);

describe('LogPage virtualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a standard table body for small datasets', async () => {
    listCategoriesMock.mockResolvedValue([buildCategory()]);
    listExpensesMock.mockResolvedValue([
      buildExpense({ id: 'expense-1', note: 'First' }),
      buildExpense({ id: 'expense-2', note: 'Second' })
    ]);

    render(<LogPage />);

    const body = await screen.findByTestId('expenses-body');
    expect(body).toHaveAttribute('data-virtualized', 'false');

    const rows = within(body).getAllByTestId('expense-row');
    expect(rows).toHaveLength(2);
  });

  it('enables virtualization for large datasets', async () => {
    listCategoriesMock.mockResolvedValue([buildCategory()]);
    const largeDataset: Expense[] = Array.from({ length: 1500 }, (_, index) =>
      buildExpense({ id: `expense-${index}`, note: `Row ${index}` })
    );
    listExpensesMock.mockResolvedValue(largeDataset);

    render(<LogPage />);

    const body = await screen.findByTestId('expenses-body');
    expect(body).toHaveAttribute('data-virtualized', 'true');

    await screen.findAllByTestId('expense-row');
    const renderedRows = within(body).getAllByTestId('expense-row');
    expect(renderedRows.length).toBeLessThan(largeDataset.length);
    expect(renderedRows.length).toBeGreaterThan(0);
  });
});
