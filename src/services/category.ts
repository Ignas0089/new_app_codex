import { createId } from '@paralleldrive/cuid2';

import type { CategoryRecord, ExpenseDatabase } from '@db/db';
import { db } from '@db/db';
import { CategoryCreateSchema, CategorySchema, CategoryUpdateSchema } from '@domain/schemas';
import type { Category } from '@domain/types';
import { getCurrentIsoTimestamp } from '@utils/dates';

function toCategory(record: CategoryRecord): Category {
  return CategorySchema.parse(record);
}

export interface ListCategoriesOptions {
  includeHidden?: boolean;
}

export async function listCategories(
  options: ListCategoriesOptions = {},
  database: ExpenseDatabase = db
): Promise<Category[]> {
  const categories = await database.categories.toArray();
  return categories
    .filter((category) => options.includeHidden || !category.isHidden)
    .map(toCategory)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategoryById(id: string, database: ExpenseDatabase = db): Promise<Category | null> {
  const record = await database.categories.get(id);
  return record ? toCategory(record) : null;
}

export async function createCategory(
  input: unknown,
  database: ExpenseDatabase = db
): Promise<Category> {
  const parsed = CategoryCreateSchema.parse(input);
  const now = getCurrentIsoTimestamp();
  const record: CategoryRecord = {
    id: parsed.id ?? createId(),
    name: parsed.name.trim(),
    color: parsed.color ?? undefined,
    isHidden: parsed.isHidden ?? false,
    createdAt: now,
    updatedAt: now
  };

  await database.categories.put(record);
  return toCategory(record);
}

export async function updateCategory(
  id: string,
  patch: unknown,
  database: ExpenseDatabase = db
): Promise<Category> {
  const parsed = CategoryUpdateSchema.parse(patch);
  const existing = await database.categories.get(id);
  if (!existing) {
    throw new Error(`Category ${id} not found`);
  }

  const now = getCurrentIsoTimestamp();
  const updated: CategoryRecord = {
    ...existing,
    ...parsed,
    color: parsed.color === null ? undefined : parsed.color ?? existing.color,
    updatedAt: now
  };

  await database.categories.put(updated);
  return toCategory(updated);
}

export async function setCategoryHidden(
  id: string,
  isHidden: boolean,
  database: ExpenseDatabase = db
): Promise<Category> {
  return updateCategory(id, { isHidden }, database);
}

export async function deleteCategory(id: string, database: ExpenseDatabase = db): Promise<void> {
  const usageCount = await database.expenses.where('categoryId').equals(id).count();
  if (usageCount > 0) {
    throw new Error('Cannot delete category that has associated expenses. Consider hiding it instead.');
  }

  await database.categories.delete(id);
}
