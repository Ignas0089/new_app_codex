import Dexie, { Table } from 'dexie';

export interface CategoryRecord {
  id: string;
  name: string;
  color?: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRecord {
  id: string;
  amountCents: number;
  currency: 'EUR';
  date: string;
  month: string;
  categoryId: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetRecord {
  id: string;
  month: string;
  categoryId: string;
  limitCents: number;
  carryOverPrev: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingRecord<TValue = unknown> {
  key: string;
  value: TValue;
}

export class ExpenseDatabase extends Dexie {
  categories!: Table<CategoryRecord>;
  expenses!: Table<ExpenseRecord>;
  budgets!: Table<BudgetRecord>;
  settings!: Table<SettingRecord>;

  constructor(name = 'expense-tracker') {
    super(name);

    this.version(1).stores({
      categories: 'id, name, isHidden, createdAt, updatedAt',
      expenses: 'id, month, date, categoryId, createdAt, updatedAt',
      budgets: 'id, month, categoryId, createdAt, updatedAt',
      settings: 'key'
    });

    this.categories = this.table('categories');
    this.expenses = this.table('expenses');
    this.budgets = this.table('budgets');
    this.settings = this.table('settings');
  }
}

export const db = new ExpenseDatabase();
