const MONTH_KEY_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

export function getMonthKey(value: Date | string): string {
  const date = toDate(value);
  return date.toISOString().slice(0, 7);
}

export function ensureMonthKey(month: string): string {
  if (!MONTH_KEY_REGEX.test(month)) {
    throw new Error(`Invalid month key: ${month}`);
  }

  return month;
}

export function shiftMonthKey(month: string, offset: number): string {
  ensureMonthKey(month);
  const [yearStr, monthStr] = month.split('-');
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10) - 1 + offset;
  const shifted = new Date(Date.UTC(year, monthIndex, 1));
  return shifted.toISOString().slice(0, 7);
}

export function getPreviousMonthKey(month: string): string {
  return shiftMonthKey(month, -1);
}

export function getNextMonthKey(month: string): string {
  return shiftMonthKey(month, 1);
}

export function startOfMonthIso(month: string): string {
  ensureMonthKey(month);
  const [yearStr, monthStr] = month.split('-');
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  return date.toISOString();
}

export function endOfMonthIso(month: string): string {
  ensureMonthKey(month);
  const [yearStr, monthStr] = month.split('-');
  const year = Number.parseInt(yearStr, 10);
  const monthIndex = Number.parseInt(monthStr, 10);
  const date = new Date(Date.UTC(year, monthIndex, 0, 23, 59, 59, 999));
  return date.toISOString();
}

export function isSameMonth(a: Date | string, b: Date | string): boolean {
  return getMonthKey(a) === getMonthKey(b);
}

export function clampDateToMonth(date: Date | string, month: string): string {
  const iso = toDate(date).toISOString();
  const start = startOfMonthIso(month);
  const end = endOfMonthIso(month);
  if (iso < start) {
    return start;
  }
  if (iso > end) {
    return end;
  }
  return iso;
}
