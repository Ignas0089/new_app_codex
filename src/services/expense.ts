import type { Collection } from 'dexie';

import type { ExpenseRecord, ExpenseDatabase } from '@db/db';
import { db } from '@db/db';
import { ExpenseCreateSchema, ExpenseSchema, ExpenseUpdateSchema } from '@domain/schemas';
import type { Expense, MonthKey } from '@domain/types';
import { getCurrentIsoTimestamp, getMonthKey } from '@utils/dates';
import { createId } from '@paralleldrive/cuid2';

function toExpense(record: ExpenseRecord): Expense {
  return ExpenseSchema.parse(record);
}

export interface ExpenseFilters {
  month?: MonthKey;
  categoryId?: string;
  search?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

function applyFilters(
  collection: Collection<ExpenseRecord, string>,
  filters: ExpenseFilters
): Collection<ExpenseRecord, string> {
  let result = collection;

  if (filters.categoryId) {
    result = result.and((expense) => expense.categoryId === filters.categoryId);
  }

  if (filters.search) {
    const query = filters.search.trim().toLowerCase();
    if (query.length > 0) {
      result = result.and((expense) => expense.note?.toLowerCase().includes(query) ?? false);
    }
  }

  return result;
}

export async function listExpenses(
  filters: ExpenseFilters = {},
  database: ExpenseDatabase = db
): Promise<Expense[]> {
  const order = filters.order ?? 'desc';
  let collection: Collection<ExpenseRecord, string>;

  if (filters.month) {
    collection = database.expenses.where('month').equals(filters.month);
  } else {
    collection = database.expenses.toCollection();
  }

  const filtered = applyFilters(collection, filters);
  const records = (await filtered.toArray()).sort((a, b) =>
    order === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)
  );

  const limited = typeof filters.limit === 'number' ? records.slice(0, filters.limit) : records;
  return limited.map(toExpense);
}

export async function getExpenseById(id: string, database: ExpenseDatabase = db): Promise<Expense | null> {
  const record = await database.expenses.get(id);
  return record ? toExpense(record) : null;
}

export async function createExpense(input: unknown, database: ExpenseDatabase = db): Promise<Expense> {
  const parsed = ExpenseCreateSchema.parse(input);
  const now = getCurrentIsoTimestamp();
  const month = parsed.month ?? getMonthKey(parsed.date);
  const record: ExpenseRecord = {
    id: parsed.id ?? createId(),
    amountCents: parsed.amountCents,
    currency: 'EUR',
    date: parsed.date,
    month,
    categoryId: parsed.categoryId,
    note: parsed.note,
    createdAt: now,
    updatedAt: now
  };

  await database.expenses.put(record);
  return toExpense(record);
}

export async function updateExpense(
  id: string,
  patch: unknown,
  database: ExpenseDatabase = db
): Promise<Expense> {
  const parsed = ExpenseUpdateSchema.parse(patch);
  const existing = await database.expenses.get(id);
  if (!existing) {
    throw new Error(`Expense ${id} not found`);
  }

  const now = getCurrentIsoTimestamp();
  const nextDate = parsed.date ?? existing.date;
  const record: ExpenseRecord = {
    ...existing,
    ...parsed,
    date: nextDate,
    month: parsed.month ?? getMonthKey(nextDate),
    updatedAt: now
  };

  await database.expenses.put(record);
  return toExpense(record);
}

export async function deleteExpense(id: string, database: ExpenseDatabase = db): Promise<void> {
  await database.expenses.delete(id);
}
