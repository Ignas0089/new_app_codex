import type { ExpenseDatabase } from '@db/db';
import { db } from '@db/db';
import type { BudgetSnapshot, MonthKey } from '@domain/types';
import { getMonthKey, getPreviousMonthKey } from '@utils/dates';
import { getBudgetSnapshots } from './budget';

export interface BudgetVsActualRow extends BudgetSnapshot {}

export interface CategorySpendRow {
  categoryId: string;
  month: MonthKey;
  totalCents: number;
}

export interface TrendPoint {
  month: MonthKey;
  totalCents: number;
}

export interface TrendOptions {
  startMonth?: MonthKey;
  monthsBack?: number;
}

export async function getBudgetVsActual(
  month: MonthKey,
  database: ExpenseDatabase = db
): Promise<BudgetVsActualRow[]> {
  return getBudgetSnapshots(month, database);
}

export async function getSpendByCategory(
  month: MonthKey,
  database: ExpenseDatabase = db
): Promise<CategorySpendRow[]> {
  const expenses = await database.expenses.where('month').equals(month).toArray();
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amountCents);
  }

  return Array.from(totals.entries())
    .map(([categoryId, totalCents]) => ({ categoryId, month, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);
}

export async function getTrendOverTime(
  options: TrendOptions = {},
  database: ExpenseDatabase = db
): Promise<TrendPoint[]> {
  const monthsBack = options.monthsBack ?? 11;
  const start = options.startMonth ?? getMonthKey(new Date());

  const months: MonthKey[] = [start];
  for (let i = 1; i <= monthsBack; i += 1) {
    months.push(getPreviousMonthKey(months[i - 1]));
  }

  const results: TrendPoint[] = [];
  for (const month of months) {
    const expenses = await database.expenses.where('month').equals(month).toArray();
    const totalCents = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
    results.push({ month, totalCents });
  }

  return results.reverse();
}
