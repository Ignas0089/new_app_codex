import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { BudgetSnapshot, Category } from '@domain/types';
import { getMonthKey, getPreviousMonthKey } from '@utils/dates';

vi.mock('@services/category', () => ({
  listCategories: vi.fn()
}));

vi.mock('@services/report', () => ({
  getBudgetVsActual: vi.fn(),
  getSpendByCategory: vi.fn(),
  getTrendOverTime: vi.fn()
}));

vi.mock('chart.js', () => {
  const destroy = vi.fn();
  const Chart = vi.fn(() => ({ destroy }));
  Chart.register = vi.fn();
  Chart.defaults = { font: { family: '' }, color: '' } as any;
  return {
    Chart,
    ArcElement: vi.fn(),
    BarElement: vi.fn(),
    CategoryScale: vi.fn(),
    Legend: vi.fn(),
    LineElement: vi.fn(),
    LinearScale: vi.fn(),
    PointElement: vi.fn(),
    Tooltip: vi.fn()
  };
});

import { listCategories } from '@services/category';
import { getBudgetVsActual, getSpendByCategory, getTrendOverTime } from '@services/report';
import { ReportsPage } from '../Reports';

const listCategoriesMock = vi.mocked(listCategories);
const getBudgetVsActualMock = vi.mocked(getBudgetVsActual);
const getSpendByCategoryMock = vi.mocked(getSpendByCategory);
const getTrendOverTimeMock = vi.mocked(getTrendOverTime);
const originalGetContext = HTMLCanvasElement.prototype.getContext;
const canvasContextMock = vi.fn(() => ({}));

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: canvasContextMock,
    configurable: true
  });
});

afterEach(() => {
  canvasContextMock.mockClear();
});

afterAll(() => {
  if (originalGetContext) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: originalGetContext,
      configurable: true
    });
  } else {
    delete HTMLCanvasElement.prototype.getContext;
  }
});

const currentMonth = getMonthKey(new Date());
const previousMonth = getPreviousMonthKey(currentMonth);

const categories: Category[] = [
  {
    id: 'cat-food',
    name: 'Groceries',
    color: '#16a34a',
    isHidden: false,
    createdAt: `${currentMonth}-01T00:00:00.000Z`,
    updatedAt: `${currentMonth}-01T00:00:00.000Z`
  },
  {
    id: 'cat-travel',
    name: 'Travel',
    color: '#2563eb',
    isHidden: false,
    createdAt: `${currentMonth}-01T00:00:00.000Z`,
    updatedAt: `${currentMonth}-01T00:00:00.000Z`
  }
];

const budgetSnapshots: BudgetSnapshot[] = [
  {
    categoryId: 'cat-food',
    month: currentMonth,
    limitCents: 50000,
    actualCents: 40000,
    carryInCents: 1000,
    availableCents: 11000,
    status: 'ok'
  },
  {
    categoryId: 'cat-travel',
    month: currentMonth,
    limitCents: 30000,
    actualCents: 35000,
    carryInCents: 0,
    availableCents: -5000,
    status: 'over'
  }
];

const categorySpend = [
  { categoryId: 'cat-food', month: currentMonth, totalCents: 40000 },
  { categoryId: 'cat-travel', month: currentMonth, totalCents: 35000 }
];

const trend = [
  { month: previousMonth, totalCents: 60000 },
  { month: currentMonth, totalCents: 75000 }
];

beforeEach(() => {
  vi.clearAllMocks();
  listCategoriesMock.mockResolvedValue(categories);
  getBudgetVsActualMock.mockResolvedValue(budgetSnapshots);
  getSpendByCategoryMock.mockResolvedValue(categorySpend);
  getTrendOverTimeMock.mockResolvedValue(trend);
});

describe('ReportsPage', () => {
  it('renders insights, summary metrics, and chart sections', async () => {
    render(<ReportsPage />);

    await screen.findByText('Budget vs actual');

    const summary = screen.getByLabelText('Month summary');
    expect(summary).toHaveTextContent('Budgeted');
    expect(summary.textContent).toMatch(/€\s*810\.00/);
    expect(summary.textContent).toMatch(/€\s*750\.00/);
    expect(summary.textContent).toMatch(/€\s*60\.00/);
    expect(summary).toHaveTextContent('93%');
    expect(summary).toHaveTextContent('Groceries');

    expect(screen.getByText(/You’re over last month by/i)).toBeInTheDocument();
    expect(screen.getByText(/You’re over by/i)).toBeInTheDocument();

    expect(await screen.findByText('Budget vs actual')).toBeInTheDocument();
    expect(screen.getByText('Category breakdown')).toBeInTheDocument();
    expect(screen.getByText('Trends')).toBeInTheDocument();

    await waitFor(() => {
      expect(listCategoriesMock).toHaveBeenCalledWith({ includeHidden: true });
      expect(getBudgetVsActualMock).toHaveBeenCalledWith(currentMonth);
      expect(getSpendByCategoryMock).toHaveBeenCalledWith(currentMonth);
      expect(getTrendOverTimeMock).toHaveBeenCalledWith({ startMonth: currentMonth, monthsBack: 11 });
    });
  });
});
