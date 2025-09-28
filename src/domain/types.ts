import type { z } from 'zod';
import {
  BackupSchema,
  BudgetSchema,
  CategorySchema,
  ExpenseSchema,
  MonthKeySchema,
  SettingSchema
} from './schemas';

export type MonthKey = z.infer<typeof MonthKeySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type Setting = z.infer<typeof SettingSchema>;
export type BackupPayload = z.infer<typeof BackupSchema>;

export type CurrencyCode = Expense['currency'];

export type BudgetStatusLevel = 'ok' | 'approaching' | 'over';

export interface BudgetSnapshot {
  categoryId: string;
  month: MonthKey;
  limitCents: number;
  actualCents: number;
  carryInCents: number;
  availableCents: number;
  status: BudgetStatusLevel;
}
