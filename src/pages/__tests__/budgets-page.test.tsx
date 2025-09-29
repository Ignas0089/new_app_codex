import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Budget, BudgetSnapshot, Category } from '@domain/types';
import { getMonthKey } from '@utils/dates';

vi.mock('@services/category', () => ({
  listCategories: vi.fn()
}));

vi.mock('@services/budget', () => ({
  listBudgets: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn()
}));

vi.mock('@utils/useBudgetBadges', () => ({
  useBudgetBadges: vi.fn()
}));

import { listCategories } from '@services/category';
import { createBudget, listBudgets, updateBudget } from '@services/budget';
import { useBudgetBadges } from '@utils/useBudgetBadges';
import { BudgetsPage } from '../Budgets';

const listCategoriesMock = vi.mocked(listCategories);
const listBudgetsMock = vi.mocked(listBudgets);
const createBudgetMock = vi.mocked(createBudget);
const updateBudgetMock = vi.mocked(updateBudget);
const useBudgetBadgesMock = vi.mocked(useBudgetBadges);

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
    id: 'cat-travel',
    name: 'Travel',
    color: '#2563eb',
    isHidden: false,
    createdAt: `${currentMonth}-01T00:00:00.000Z`,
    updatedAt: `${currentMonth}-01T00:00:00.000Z`
  }
];

const baseBadges: BudgetSnapshot[] = [
  {
    categoryId: 'cat-food',
    month: currentMonth,
    limitCents: 30000,
    actualCents: 12000,
    carryInCents: 0,
    availableCents: 18000,
    status: 'ok'
  }
];

let budgets: Budget[];
const refreshSpy = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  budgets = [
    {
      id: 'budget-food',
      month: currentMonth,
      categoryId: 'cat-food',
      limitCents: 30000,
      carryOverPrev: false,
      createdAt: `${currentMonth}-01T00:00:00.000Z`,
      updatedAt: `${currentMonth}-01T00:00:00.000Z`
    }
  ];

  refreshSpy.mockClear();

  listCategoriesMock.mockResolvedValue(categories);
  listBudgetsMock.mockImplementation(async (filters = {}) => {
    let result = budgets;
    if (filters.month) {
      result = result.filter((budget) => budget.month === filters.month);
    }
    if (filters.categoryId) {
      result = result.filter((budget) => budget.categoryId === filters.categoryId);
    }
    return [...result];
  });

  createBudgetMock.mockImplementation(async (input: any) => {
    const budget: Budget = {
      id: input.id ?? `budget-${Math.random().toString(36).slice(2, 8)}`,
      month: input.month,
      categoryId: input.categoryId,
      limitCents: input.limitCents,
      carryOverPrev: input.carryOverPrev ?? false,
      createdAt: `${input.month}-01T00:00:00.000Z`,
      updatedAt: `${input.month}-01T00:00:00.000Z`
    };
    budgets = [
      ...budgets.filter((existing) => existing.id !== budget.id),
      budget
    ];
    return budget;
  });

  updateBudgetMock.mockImplementation(async (id: string, patch: any) => {
    const existing = budgets.find((budget) => budget.id === id);
    if (!existing) {
      throw new Error('Budget not found');
    }
    const updated: Budget = {
      ...existing,
      ...patch,
      updatedAt: `${existing.month}-01T00:00:00.000Z`
    };
    budgets = budgets.map((budget) => (budget.id === id ? updated : budget));
    return updated;
  });

  useBudgetBadgesMock.mockReturnValue({
    badges: baseBadges,
    isLoading: false,
    error: null,
    refresh: vi.fn(async () => {
      refreshSpy();
    })
  });
});

describe('BudgetsPage', () => {
  it('updates an existing budget and refreshes badges', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => expect(listCategoriesMock).toHaveBeenCalled());
    await waitFor(() => expect(listBudgetsMock).toHaveBeenCalled());

    const groceryHeading = await screen.findByRole('heading', { name: 'Groceries' });
    const groceryCard = groceryHeading.closest('article');
    if (!groceryCard) {
      throw new Error('Expected groceries budget card');
    }
    const limitInput = within(groceryCard).getByLabelText('Monthly limit');

    await user.clear(limitInput);
    await user.type(limitInput, '310.00');

    const saveButton = within(groceryCard).getByRole('button', { name: 'Save changes' });
    expect(saveButton).toBeEnabled();

    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => expect(updateBudgetMock).toHaveBeenCalledWith('budget-food', {
      limitCents: 31000,
      carryOverPrev: false
    }));
    await waitFor(() => expect(refreshSpy).toHaveBeenCalled());
    await screen.findByText('Budget saved. You’re in control.');
  });

  it('creates a new budget for a category without one', async () => {
    const user = userEvent.setup();
    render(<BudgetsPage />);

    await waitFor(() => expect(listCategoriesMock).toHaveBeenCalled());
    await waitFor(() => expect(listBudgetsMock).toHaveBeenCalled());

    const travelHeading = await screen.findByRole('heading', { name: 'Travel' });
    const travelCard = travelHeading.closest('article');
    if (!travelCard) {
      throw new Error('Expected travel budget card');
    }
    const limitInput = within(travelCard).getByLabelText('Monthly limit');

    await user.clear(limitInput);
    await user.type(limitInput, '150.00');

    const createButton = within(travelCard).getByRole('button', { name: 'Create budget' });
    expect(createButton).toBeEnabled();

    await act(async () => {
      await user.click(createButton);
    });

    await waitFor(() =>
      expect(createBudgetMock).toHaveBeenCalledWith({
        month: currentMonth,
        categoryId: 'cat-travel',
        limitCents: 15000,
        carryOverPrev: false
      })
    );
    await waitFor(() => expect(refreshSpy).toHaveBeenCalled());
    await screen.findByText('Budget saved. You’re in control.');
    expect(listBudgetsMock).toHaveBeenCalledWith({ month: currentMonth });
  });
});
