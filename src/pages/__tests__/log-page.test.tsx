import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Category, Expense } from '@domain/types';
import { getMonthKey } from '@utils/dates';
import type { ExpenseFilters } from '@services/expense';

vi.mock('@services/category', () => ({
  listCategories: vi.fn()
}));

vi.mock('@services/expense', () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn()
}));

import { LogPage } from '../Log';
import { listCategories } from '@services/category';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '@services/expense';

const listCategoriesMock = vi.mocked(listCategories);
const listExpensesMock = vi.mocked(listExpenses);
const createExpenseMock = vi.mocked(createExpense);
const updateExpenseMock = vi.mocked(updateExpense);
const deleteExpenseMock = vi.mocked(deleteExpense);

const currentMonth = getMonthKey(new Date());

const categories: Category[] = [
  {
    id: 'cat-food',
    name: 'Groceries',
    color: '#16a34a',
    isHidden: false,
    createdAt: `${currentMonth}-01T00:00:00.000Z`,
    updatedAt: `${currentMonth}-01T00:00:00.000Z`
  },
  {
    id: 'cat-home',
    name: 'Home',
    color: '#2563eb',
    isHidden: false,
    createdAt: `${currentMonth}-01T00:00:00.000Z`,
    updatedAt: `${currentMonth}-01T00:00:00.000Z`
  }
];

const buildExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: overrides.id ?? 'exp-1',
  amountCents: overrides.amountCents ?? 950,
  currency: 'EUR',
  date: overrides.date ?? `${currentMonth}-10T12:00:00.000Z`,
  month: overrides.month ?? currentMonth,
  categoryId: overrides.categoryId ?? 'cat-food',
  note: overrides.note,
  createdAt: overrides.createdAt ?? `${currentMonth}-10T12:00:00.000Z`,
  updatedAt: overrides.updatedAt ?? `${currentMonth}-10T12:00:00.000Z`
});

let expenses: Expense[];

function applyExpenseFilters(items: Expense[], filters: ExpenseFilters = {}): Expense[] {
  let result = [...items];
  if (filters.month) {
    result = result.filter((expense) => expense.month === filters.month);
  }
  if (filters.categoryId) {
    result = result.filter((expense) => expense.categoryId === filters.categoryId);
  }
  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    if (query) {
      result = result.filter((expense) => expense.note?.toLowerCase().includes(query));
    }
  }
  const order = filters.order ?? 'desc';
  result.sort((a, b) =>
    order === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
  );
  if (typeof filters.limit === 'number') {
    result = result.slice(0, filters.limit);
  }
  return result;
}

beforeEach(() => {
  vi.clearAllMocks();
  expenses = [buildExpense({ id: 'exp-1', note: 'Morning coffee', amountCents: 350 })];

  listCategoriesMock.mockResolvedValue(categories);
  listExpensesMock.mockImplementation(async (filters = {}) => applyExpenseFilters(expenses, filters));

  createExpenseMock.mockImplementation(async (input: any) => {
    const expense: Expense = {
      id: input.id ?? `exp-${Math.random().toString(36).slice(2, 8)}`,
      amountCents: input.amountCents,
      currency: 'EUR',
      date: input.date,
      month: input.month ?? getMonthKey(input.date),
      categoryId: input.categoryId,
      note: input.note,
      createdAt: input.createdAt ?? input.date,
      updatedAt: input.updatedAt ?? input.date
    };
    expenses = [expense, ...expenses.filter((item) => item.id !== expense.id)];
    return expense;
  });

  updateExpenseMock.mockImplementation(async (id: string, patch: any) => {
    const existing = expenses.find((expense) => expense.id === id);
    if (!existing) {
      throw new Error('Expense not found');
    }
    const nextDate = patch.date ?? existing.date;
    const updated: Expense = {
      ...existing,
      ...patch,
      date: nextDate,
      month: patch.month ?? getMonthKey(nextDate),
      updatedAt: patch.updatedAt ?? nextDate
    };
    expenses = expenses.map((expense) => (expense.id === id ? updated : expense));
    return updated;
  });

  deleteExpenseMock.mockImplementation(async (id: string) => {
    expenses = expenses.filter((expense) => expense.id !== id);
  });
});

describe('LogPage', () => {
  it('creates a new expense and shows the undo banner', async () => {
    const user = userEvent.setup();
    render(<LogPage />);

    await waitFor(() => expect(listCategoriesMock).toHaveBeenCalled());
    await waitFor(() => expect(listExpensesMock).toHaveBeenCalled());

    await screen.findByText('Latest entries');
    await screen.findByText('Morning coffee');

    const amountInput = screen.getByLabelText(/Amount/i, { selector: 'input[name="amount"]' });
    await user.clear(amountInput);
    await user.type(amountInput, '42.10');

    const dateInput = screen.getByLabelText(/Date/i, { selector: 'input[type="date"]' });
    await user.clear(dateInput);
    await user.type(dateInput, `${currentMonth}-15`);

    const noteInput = screen.getByLabelText('Note', { selector: 'textarea' });
    await user.type(noteInput, 'Dinner with friends');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Add expense' }));
    });

    await waitFor(() => expect(createExpenseMock).toHaveBeenCalledTimes(1));
    await screen.findByText('Dinner with friends');
    expect(screen.getByRole('status')).toHaveTextContent('Expense saved.');
  });

  it('edits an existing expense and restores the form state', async () => {
    const user = userEvent.setup();
    render(<LogPage />);

    await waitFor(() => expect(listCategoriesMock).toHaveBeenCalled());
    await waitFor(() => expect(listExpensesMock).toHaveBeenCalled());

    const row = await screen.findByText('Morning coffee');
    const tableRow = row.closest('tr');
    expect(tableRow).not.toBeNull();

    if (!tableRow) {
      return;
    }

    await act(async () => {
      await user.click(within(tableRow).getByRole('button', { name: /edit/i }));
    });

    const noteInput = screen.getByLabelText('Note', { selector: 'textarea' });
    await user.clear(noteInput);
    await user.type(noteInput, 'Morning coffee updated');

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Save changes' }));
    });

    await waitFor(() => expect(updateExpenseMock).toHaveBeenCalledTimes(1));
    await screen.findByText('Morning coffee updated');
    expect(screen.getByRole('status')).toHaveTextContent('Expense updated.');
  });

  it('deletes an expense and allows undoing the removal', async () => {
    const user = userEvent.setup();
    render(<LogPage />);

    await waitFor(() => expect(listCategoriesMock).toHaveBeenCalled());
    await waitFor(() => expect(listExpensesMock).toHaveBeenCalled());

    const row = await screen.findByText('Morning coffee');
    const tableRow = row.closest('tr');
    expect(tableRow).not.toBeNull();

    if (!tableRow) {
      return;
    }

    await act(async () => {
      await user.click(within(tableRow).getByRole('button', { name: /delete/i }));
    });

    const dialog = await screen.findByRole('alertdialog');
    await act(async () => {
      await user.click(within(dialog).getByRole('button', { name: 'Delete' }));
    });

    await waitFor(() => expect(deleteExpenseMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByText('Morning coffee')).not.toBeInTheDocument());

    const undoBanner = screen.getByRole('status');
    expect(undoBanner).toHaveTextContent('Expense deleted.');

    await act(async () => {
      await user.click(within(undoBanner).getByRole('button', { name: /undo/i }));
    });

    await waitFor(() => expect(createExpenseMock).toHaveBeenCalledTimes(1));
    await screen.findByText('Morning coffee');
  });
});
