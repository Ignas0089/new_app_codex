import { createId } from '@paralleldrive/cuid2';

import type { ExpenseDatabase } from './db';
import { db } from './db';
import { getCurrentIsoTimestamp } from '@utils/dates';

const SEED_VERSION_KEY = 'seed:version';
const SEED_VERSION_VALUE = 1;

const DEFAULT_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: 'Groceries', color: '#2563eb' },
  { name: 'Housing', color: '#9333ea' },
  { name: 'Transport', color: '#0d9488' },
  { name: 'Utilities', color: '#f59e0b' },
  { name: 'Dining Out', color: '#f97316' },
  { name: 'Health', color: '#db2777' },
  { name: 'Leisure', color: '#3b82f6' },
  { name: 'Savings', color: '#16a34a' }
];

const DEFAULT_SETTINGS: Array<{ key: string; value: unknown }> = [
  { key: 'currency', value: 'EUR' },
  { key: 'onboarding.completed', value: false }
];

export async function seedDatabase(database: ExpenseDatabase = db): Promise<void> {
  const existingSeed = await database.settings.get(SEED_VERSION_KEY);
  if (existingSeed?.value === SEED_VERSION_VALUE) {
    return;
  }

  await database.transaction('rw', database.categories, database.settings, async () => {
    const now = getCurrentIsoTimestamp();
    const categoryCount = await database.categories.count();

    if (categoryCount === 0) {
      await database.categories.bulkAdd(
        DEFAULT_CATEGORIES.map((category) => ({
          id: createId(),
          name: category.name,
          color: category.color,
          isHidden: false,
          createdAt: now,
          updatedAt: now
        }))
      );
    }

    for (const setting of DEFAULT_SETTINGS) {
      await database.settings.put({ ...setting });
    }

    await database.settings.put({ key: SEED_VERSION_KEY, value: SEED_VERSION_VALUE });
  });
}
