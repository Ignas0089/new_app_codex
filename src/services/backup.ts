import type { ExpenseDatabase, SettingRecord } from '@db/db';
import { db } from '@db/db';
import { BackupSchema, BudgetSchema, CategorySchema, ExpenseSchema, SettingSchema } from '@domain/schemas';
import type { BackupPayload } from '@domain/types';
import { getCurrentIsoTimestamp } from '@utils/dates';

export interface ImportOptions {
  merge?: boolean;
  keepExistingSettings?: boolean;
}

export interface ClearOptions {
  keepSettings?: boolean;
}

export async function exportBackup(database: ExpenseDatabase = db): Promise<BackupPayload> {
  const [categories, budgets, expenses, settings] = await Promise.all([
    database.categories.toArray(),
    database.budgets.toArray(),
    database.expenses.toArray(),
    database.settings.toArray()
  ]);

  return {
    version: 1,
    exportedAt: getCurrentIsoTimestamp(),
    categories: categories.map((record) => CategorySchema.parse(record)),
    budgets: budgets.map((record) => BudgetSchema.parse(record)),
    expenses: expenses.map((record) => ExpenseSchema.parse(record)),
    settings: settings.map((record) => SettingSchema.parse(record))
  };
}

export async function clearAllData(
  database: ExpenseDatabase = db,
  options: ClearOptions = {}
): Promise<void> {
  await database.transaction('rw', database.categories, database.budgets, database.expenses, database.settings, async () => {
    await database.categories.clear();
    await database.budgets.clear();
    await database.expenses.clear();
    if (!options.keepSettings) {
      await database.settings.clear();
    }
  });
}

export async function importBackup(
  payload: unknown,
  options: ImportOptions = {},
  database: ExpenseDatabase = db
): Promise<void> {
  const data = BackupSchema.parse(payload);

  if (!options.merge) {
    await clearAllData(database, { keepSettings: options.keepExistingSettings ?? false });
  }

  await database.transaction(
    'rw',
    database.categories,
    database.budgets,
    database.expenses,
    database.settings,
    async () => {
      if (options.merge) {
        // Remove existing records with the same ids to avoid duplicates before bulkPut
        const categoryIds = data.categories.map((category) => category.id);
        const budgetIds = data.budgets.map((budget) => budget.id);
        const expenseIds = data.expenses.map((expense) => expense.id);

        await Promise.all([
          database.categories.bulkDelete(categoryIds),
          database.budgets.bulkDelete(budgetIds),
          database.expenses.bulkDelete(expenseIds)
        ]);
      }

      await database.categories.bulkPut(data.categories);
      await database.budgets.bulkPut(data.budgets);
      await database.expenses.bulkPut(data.expenses);

      if (!options.keepExistingSettings) {
        await database.settings.clear();
      }

      const settingRecords: SettingRecord[] = data.settings.map((setting) => ({
        key: setting.key,
        value: setting.value
      }));

      await database.settings.bulkPut(settingRecords);
    }
  );
}
