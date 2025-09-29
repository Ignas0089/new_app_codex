import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listCategories } from '@services/category';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '@services/expense';
import type { Category, Expense } from '@domain/types';

import { LogPage } from './index';

vi.mock('@services/category', () => ({
  listCategories: vi.fn()
}));

vi.mock('@services/expense', () => ({
  listExpenses: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn()
}));

const listCategoriesMock = vi.mocked(listCategories);
const listExpensesMock = vi.mocked(listExpenses);
const createExpenseMock = vi.mocked(createExpense);
const updateExpenseMock = vi.mocked(updateExpense);
const deleteExpenseMock = vi.mocked(deleteExpense);

const categories: Category[] = [
  {
    id: 'cat-1',
    name: 'Food',
    color: '#ff0000',
    isHidden: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-2',
    name: 'Home',
    color: '#00ff00',
    isHidden: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

const baseExpense: Expense = {
  id: 'expense-1',
  amountCents: 1250,
  currency: 'EUR',
  date: '2024-05-01T00:00:00.000Z',
  month: '2024-05',
  categoryId: 'cat-1',
  note: 'Groceries',
  createdAt: '2024-05-01T12:00:00.000Z',
  updatedAt: '2024-05-01T12:00:00.000Z'
};

const secondExpense: Expense = {
  id: 'expense-2',
  amountCents: 2500,
  currency: 'EUR',
  date: '2024-05-03T00:00:00.000Z',
  month: '2024-05',
  categoryId: 'cat-2',
  note: 'Utilities',
  createdAt: '2024-05-03T12:00:00.000Z',
  updatedAt: '2024-05-03T12:00:00.000Z'
};

function cloneExpense(expense: Expense): Expense {
  return JSON.parse(JSON.stringify(expense));
}

let currentExpenses: Expense[] = [];
let nextExpenseId = 3;
let createdExpenseIds: string[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  currentExpenses = [cloneExpense(baseExpense), cloneExpense(secondExpense)];
  nextExpenseId = 3;
  createdExpenseIds = [];

  listCategoriesMock.mockResolvedValue(categories);
  listExpensesMock.mockImplementation(async () => currentExpenses.map(cloneExpense));
  createExpenseMock.mockImplementation(async (input: any) => {
    const id = input.id ?? `expense-${nextExpenseId++}`;
    const created: Expense = {
      id,
      amountCents: input.amountCents,
      currency: 'EUR',
      date: input.date,
      month: input.month,
      categoryId: input.categoryId,
      note: input.note,
      createdAt: '2024-05-05T12:00:00.000Z',
      updatedAt: '2024-05-05T12:00:00.000Z'
    };
    currentExpenses = [created, ...currentExpenses.filter((expense) => expense.id !== id)];
    createdExpenseIds.push(id);
    return cloneExpense(created);
  });
  updateExpenseMock.mockImplementation(async (id: string, patch: any) => {
    const existing = currentExpenses.find((expense) => expense.id === id);
    if (!existing) {
      throw new Error('Expense not found');
    }
    const updated: Expense = {
      ...existing,
      ...patch,
      updatedAt: '2024-05-06T12:00:00.000Z'
    };
    currentExpenses = currentExpenses.map((expense) => (expense.id === id ? updated : expense));
    return cloneExpense(updated);
  });
  deleteExpenseMock.mockImplementation(async (id: string) => {
    currentExpenses = currentExpenses.filter((expense) => expense.id !== id);
  });
});

describe('LogPage table interactions', () => {
  it('supports keyboard navigation, inline editing, and delete shortcut', async () => {
    const user = userEvent.setup();
    render(<LogPage />);

    await waitFor(() => expect(listExpensesMock).toHaveBeenCalled());
    const tableRegion = await screen.findByTestId('expense-table');
    const rows = within(tableRegion).getAllByRole('row');
    const firstDataRow = rows[1];
    firstDataRow.focus();
    expect(document.activeElement).toBe(firstDataRow);

    await user.keyboard('{ArrowDown}');
    const secondDataRow = rows[2];
    expect(document.activeElement).toBe(secondDataRow);

    await user.keyboard('e');
    const amountInput = within(secondDataRow).getByLabelText(/Amount for/i);
    expect(amountInput).toBeInTheDocument();

    await user.click(within(secondDataRow).getByRole('button', { name: /Cancel/i }));
    await waitFor(() => expect(document.activeElement).toBe(secondDataRow));

    await user.keyboard('{Delete}');
    expect(
      await screen.findByRole('alertdialog', {
        name: /Delete expense/i
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Cancel/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('queues multi-step undo actions and applies them in order', async () => {
    const user = userEvent.setup();
    render(<LogPage />);

    await waitFor(() => expect(listExpensesMock).toHaveBeenCalled());
    const amountInput = await screen.findByRole('textbox', { name: /Amount/i });
    const dateInput = await screen.findByLabelText('Date', { selector: 'input' });
    const noteInput = await screen.findByLabelText('Note', { selector: 'textarea' });

    fireEvent.input(amountInput, { target: { value: '10.00' } });
    fireEvent.input(dateInput, { target: { value: '2024-05-05' } });
    fireEvent.input(noteInput, { target: { value: 'First stack entry' } });
    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    await waitFor(() => expect(createExpenseMock).toHaveBeenCalledTimes(1));
    expect(createdExpenseIds).toHaveLength(1);

    fireEvent.input(amountInput, { target: { value: '20.00' } });
    fireEvent.input(dateInput, { target: { value: '2024-05-06' } });
    fireEvent.input(noteInput, { target: { value: 'Second stack entry' } });
    await user.click(screen.getByRole('button', { name: 'Add expense' }));
    await waitFor(() => expect(createExpenseMock).toHaveBeenCalledTimes(2));
    expect(createdExpenseIds).toHaveLength(2);

    const undoBanner = await screen.findByRole('status');
    expect(undoBanner).toHaveTextContent('Expense saved.');
    expect(undoBanner).toHaveTextContent('(1 more)');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(deleteExpenseMock).toHaveBeenCalledWith(createdExpenseIds[1]));
    expect(await screen.findByRole('status')).toHaveTextContent('Expense saved.');

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(deleteExpenseMock).toHaveBeenCalledWith(createdExpenseIds[0]));

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  });
});
