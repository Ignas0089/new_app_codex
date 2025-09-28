import type { BudgetRecord, CategoryRecord, ExpenseDatabase, ExpenseRecord, SettingRecord } from '@db/db';

type IdentifiedRecord = { id: string } | { key: string };

type Predicate<T> = (record: T) => boolean;

interface MockCollection<T> {
  toArray(): Promise<T[]>;
  first(): Promise<T | undefined>;
  and(filter: Predicate<T>): MockCollection<T>;
  count(): Promise<number>;
}

interface WhereClause<T> {
  equals(value: unknown): MockCollection<T>;
}

interface MockTable<T extends IdentifiedRecord> {
  data: T[];
  toCollection(): MockCollection<T>;
  toArray(): Promise<T[]>;
  where(field: keyof T): WhereClause<T>;
  get(key: string): Promise<T | undefined>;
  put(record: T): Promise<string>;
  bulkPut(records: T[]): Promise<void>;
  bulkDelete(keys: string[]): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  count(): Promise<number>;
}

function getKey<T extends IdentifiedRecord>(record: T): string {
  if ('id' in record) {
    return record.id;
  }
  if ('key' in record) {
    return record.key;
  }
  throw new Error('Unsupported record shape for mock table');
}

function createCollection<T extends IdentifiedRecord>(table: MockTable<T>, predicate: Predicate<T>): MockCollection<T> {
  const applyFilter = (): T[] => table.data.filter(predicate);

  return {
    async toArray() {
      return applyFilter().map((item) => ({ ...item }));
    },
    async first() {
      const [firstItem] = applyFilter();
      return firstItem ? { ...firstItem } : undefined;
    },
    and(nextPredicate) {
      return createCollection(table, (record) => predicate(record) && nextPredicate(record));
    },
    async count() {
      return applyFilter().length;
    }
  };
}

function createTable<T extends IdentifiedRecord>(initial: T[] = []): MockTable<T> {
  const table: MockTable<T> = {
    data: initial.map((item) => ({ ...item })),
    toCollection() {
      return createCollection(table, () => true);
    },
    async toArray() {
      return this.data.map((item) => ({ ...item }));
    },
    where(field: keyof T): WhereClause<T> {
      return {
        equals(value: unknown) {
          return createCollection(table, (record) => record[field] === value);
        }
      };
    },
    async get(key: string) {
      const found = this.data.find((item) => getKey(item) === key);
      return found ? { ...found } : undefined;
    },
    async put(record: T) {
      const key = getKey(record);
      const index = this.data.findIndex((item) => getKey(item) === key);
      if (index >= 0) {
        this.data[index] = { ...record };
      } else {
        this.data.push({ ...record });
      }
      return key;
    },
    async bulkPut(records: T[]) {
      for (const record of records) {
        await this.put(record);
      }
    },
    async bulkDelete(keys: string[]) {
      this.data = this.data.filter((record) => !keys.includes(getKey(record)));
    },
    async delete(key: string) {
      this.data = this.data.filter((record) => getKey(record) !== key);
    },
    async clear() {
      this.data = [];
    },
    async count() {
      return this.data.length;
    }
  };

  return table;
}

export interface MockDatabaseSeed {
  categories?: CategoryRecord[];
  expenses?: ExpenseRecord[];
  budgets?: BudgetRecord[];
  settings?: SettingRecord[];
}

export function createMockDatabase(seed: MockDatabaseSeed = {}): ExpenseDatabase {
  const categories = createTable<CategoryRecord>(seed.categories);
  const expenses = createTable<ExpenseRecord>(seed.expenses);
  const budgets = createTable<BudgetRecord>(seed.budgets);
  const settings = createTable<SettingRecord>(seed.settings);

  const database = {
    categories,
    expenses,
    budgets,
    settings,
    async transaction(_mode: string, ...operations: unknown[]) {
      const callback = operations[operations.length - 1];
      if (typeof callback === 'function') {
        await callback();
      }
    }
  } as unknown as ExpenseDatabase;

  return database;
}
