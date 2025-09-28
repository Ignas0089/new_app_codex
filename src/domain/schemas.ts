import { z } from 'zod';

export const MoneySchema = z.number().int().nonnegative();
export const CurrencySchema = z.literal('EUR');
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const MonthKeySchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const HexColorSchema = z
  .string()
  .regex(/^#?[0-9a-fA-F]{6}$/)
  .transform((value) => (value.startsWith('#') ? value.toLowerCase() : `#${value.toLowerCase()}`));

export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(40),
  color: HexColorSchema.optional(),
  isHidden: z.boolean().default(false),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});

export const CategoryCreateSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(1).max(40),
    color: HexColorSchema.optional(),
    isHidden: z.boolean().optional()
  })
  .strict();

export const CategoryUpdateSchema = z
  .object({
    name: z.string().min(1).max(40).optional(),
    color: HexColorSchema.nullable().optional(),
    isHidden: z.boolean().optional()
  })
  .strict();

export const ExpenseSchema = z.object({
  id: z.string(),
  amountCents: MoneySchema,
  currency: CurrencySchema,
  date: IsoDateTimeSchema,
  month: MonthKeySchema,
  categoryId: z.string(),
  note: z.string().max(500).optional(),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});

export const ExpenseCreateSchema = z
  .object({
    id: z.string().optional(),
    amountCents: MoneySchema,
    currency: CurrencySchema.optional().default('EUR'),
    date: IsoDateTimeSchema,
    month: MonthKeySchema.optional(),
    categoryId: z.string(),
    note: z.string().max(500).optional()
  })
  .strict();

export const ExpenseUpdateSchema = z
  .object({
    amountCents: MoneySchema.optional(),
    date: IsoDateTimeSchema.optional(),
    month: MonthKeySchema.optional(),
    categoryId: z.string().optional(),
    note: z.string().max(500).optional()
  })
  .strict();

export const BudgetSchema = z.object({
  id: z.string(),
  month: MonthKeySchema,
  categoryId: z.string(),
  limitCents: MoneySchema,
  carryOverPrev: z.boolean().default(false),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema
});

export const BudgetCreateSchema = z
  .object({
    id: z.string().optional(),
    month: MonthKeySchema,
    categoryId: z.string(),
    limitCents: MoneySchema,
    carryOverPrev: z.boolean().optional()
  })
  .strict();

export const BudgetUpdateSchema = z
  .object({
    limitCents: MoneySchema.optional(),
    carryOverPrev: z.boolean().optional()
  })
  .strict();

export const SettingSchema = z.object({
  key: z.string(),
  value: z.unknown()
});

export const BackupSchema = z.object({
  version: z.literal(1),
  exportedAt: IsoDateTimeSchema,
  categories: z.array(CategorySchema),
  budgets: z.array(BudgetSchema),
  expenses: z.array(ExpenseSchema),
  settings: z.array(SettingSchema)
});
