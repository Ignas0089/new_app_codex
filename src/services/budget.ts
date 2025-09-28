import { createId } from '@paralleldrive/cuid2';

import type { BudgetRecord, ExpenseDatabase, ExpenseRecord } from '@db/db';
import { db } from '@db/db';
import { BudgetCreateSchema, BudgetSchema, BudgetUpdateSchema, ExpenseSchema } from '@domain/schemas';
import type { Budget, BudgetSnapshot, Expense, MonthKey } from '@domain/types';
import { calculateBudgetSnapshot } from '@domain/budget';
import { getCurrentIsoTimestamp, getPreviousMonthKey } from '@utils/dates';

function toBudget(record: BudgetRecord): Budget {
  return BudgetSchema.parse(record);
}

function toExpense(record: ExpenseRecord): Expense {
  return ExpenseSchema.parse(record);
}

export interface BudgetFilters {
  month?: MonthKey;
  categoryId?: string;
}

export async function listBudgets(
  filters: BudgetFilters = {},
  database: ExpenseDatabase = db
): Promise<Budget[]> {
  let collection = database.budgets.toCollection();

  if (filters.month) {
    collection = database.budgets.where('month').equals(filters.month);
  }

  if (filters.categoryId) {
    collection = collection.and((budget) => budget.categoryId === filters.categoryId);
  }

  const budgets = await collection.toArray();
  return budgets.map(toBudget);
}

export async function getBudgetById(id: string, database: ExpenseDatabase = db): Promise<Budget | null> {
  const record = await database.budgets.get(id);
  return record ? toBudget(record) : null;
}

export async function createBudget(input: unknown, database: ExpenseDatabase = db): Promise<Budget> {
  const parsed = BudgetCreateSchema.parse(input);
  const now = getCurrentIsoTimestamp();
  const duplicate = await database.budgets
    .where('month')
    .equals(parsed.month)
    .and((budget) => budget.categoryId === parsed.categoryId)
    .first();

  if (duplicate && duplicate.id !== parsed.id) {
    throw new Error('Budget for this category and month already exists');
  }

  const record: BudgetRecord = {
    id: parsed.id ?? createId(),
    month: parsed.month,
    categoryId: parsed.categoryId,
    limitCents: parsed.limitCents,
    carryOverPrev: parsed.carryOverPrev ?? false,
    createdAt: now,
    updatedAt: now
  };

  await database.budgets.put(record);
  return toBudget(record);
}

export async function updateBudget(
  id: string,
  patch: unknown,
  database: ExpenseDatabase = db
): Promise<Budget> {
  const parsed = BudgetUpdateSchema.parse(patch);
  const existing = await database.budgets.get(id);
  if (!existing) {
    throw new Error(`Budget ${id} not found`);
  }

  const now = getCurrentIsoTimestamp();
  const record: BudgetRecord = {
    ...existing,
    ...parsed,
    updatedAt: now
  };

  await database.budgets.put(record);
  return toBudget(record);
}

export async function deleteBudget(id: string, database: ExpenseDatabase = db): Promise<void> {
  await database.budgets.delete(id);
}

export async function getBudgetSnapshots(
  month: MonthKey,
  database: ExpenseDatabase = db
): Promise<BudgetSnapshot[]> {
  const budgets = (await database.budgets.where('month').equals(month).toArray()).map(toBudget);
  const expenses = (await database.expenses.where('month').equals(month).toArray()).map(toExpense);
  const previousMonth = getPreviousMonthKey(month);
  const previousBudgets = (await database.budgets.where('month').equals(previousMonth).toArray()).map(toBudget);
  const previousExpenses = (await database.expenses.where('month').equals(previousMonth).toArray()).map(toExpense);

  return buildBudgetSnapshots({
    month,
    budgets,
    expenses,
    previousBudgets,
    previousExpenses
  });
}

export interface BudgetSnapshotInputSet {
  month: MonthKey;
  budgets: Budget[];
  expenses: Expense[];
  previousBudgets?: Budget[];
  previousExpenses?: Expense[];
}

export function buildBudgetSnapshots(input: BudgetSnapshotInputSet): BudgetSnapshot[] {
  const totals = new Map<string, number>();
  for (const expense of input.expenses) {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amountCents);
  }

  const previousTotals = new Map<string, number>();
  for (const expense of input.previousExpenses ?? []) {
    previousTotals.set(expense.categoryId, (previousTotals.get(expense.categoryId) ?? 0) + expense.amountCents);
  }

  return input.budgets.map((budget) => {
    const previousBudget = input.previousBudgets?.find((item) => item.categoryId === budget.categoryId);
    return calculateBudgetSnapshot({
      budget,
      actualCents: totals.get(budget.categoryId) ?? 0,
      previousBudget,
      previousActualCents: previousBudget ? previousTotals.get(budget.categoryId) ?? 0 : undefined
    });
  });
}
