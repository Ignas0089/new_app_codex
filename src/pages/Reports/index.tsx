import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration
} from 'chart.js';
import { format } from 'date-fns';

import { Money } from '@components/Money';
import { MonthPicker } from '@components/MonthPicker';
import type { Category, MonthKey } from '@domain/types';
import { listCategories } from '@services/category';
import {
  getBudgetVsActual,
  getSpendByCategory,
  getTrendOverTime,
  type BudgetVsActualRow,
  type CategorySpendRow,
  type TrendPoint
} from '@services/report';
import { getMonthKey } from '@utils/dates';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.color = '#1f2937';

type ChartTypeUnion = 'bar' | 'pie' | 'line';
type ChartUnionConfig = ChartConfiguration<ChartTypeUnion, number[], string>;

interface ChartCardProps {
  title: string;
  description: string;
  configuration: ChartUnionConfig | null;
}

function ChartCard({ title, description, configuration }: ChartCardProps): JSX.Element {
  return (
    <article className="card">
      <header className="card__header">
        <h3 className="card__title">{title}</h3>
        <p className="card__hint">{description}</p>
      </header>
      {configuration ? (
        <div className="chart">
          <ChartCanvas title={title} configuration={configuration} />
        </div>
      ) : (
        <p className="card__empty">Add expenses to unlock charts that show how you’re pacing.</p>
      )}
    </article>
  );
}

interface ChartCanvasProps {
  configuration: ChartUnionConfig;
  title: string;
}

function ChartCanvas({ configuration, title }: ChartCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const chart = new Chart(context, configuration);
    return () => {
      chart.destroy();
    };
  }, [configuration]);

  return <canvas ref={canvasRef} role="img" aria-label={title} />;
}

const FALLBACK_COLORS = ['#2563eb', '#9333ea', '#0d9488', '#f59e0b', '#f97316', '#db2777', '#3b82f6', '#16a34a'];

export function ReportsPage(): JSX.Element {
  const [month, setMonth] = useState<MonthKey>(getMonthKey(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetRows, setBudgetRows] = useState<BudgetVsActualRow[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpendRow[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCategories = useCallback(async () => {
    try {
      const data = await listCategories({ includeHidden: true });
      setCategories(data);
    } catch (cause) {
      setError('Couldn’t load categories. Refresh to try again.');
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [budgetData, categoryData, trendData] = await Promise.all([
        getBudgetVsActual(month),
        getSpendByCategory(month),
        getTrendOverTime({ startMonth: month, monthsBack: 11 })
      ]);
      setBudgetRows(budgetData);
      setCategorySpend(categoryData);
      setTrend(trendData);
    } catch (cause) {
      setError('Couldn’t load reports. Try again.');
      setBudgetRows([]);
      setCategorySpend([]);
      setTrend([]);
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const budgetVsActualConfig = useMemo<ChartUnionConfig | null>(() => {
    if (budgetRows.length === 0) {
      return null;
    }

    const labels = budgetRows.map((row) => categoryLookup.get(row.categoryId)?.name ?? 'Unknown');
    const budgetData = budgetRows.map((row) => row.limitCents + row.carryInCents);
    const actualData = budgetRows.map((row) => row.actualCents);

    const config: ChartConfiguration<'bar', number[], string> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Budget',
            data: budgetData,
            backgroundColor: '#dbeafe',
            borderColor: '#2563eb'
          },
          {
            label: 'Actual',
            data: actualData,
            backgroundColor: '#2563eb',
            borderColor: '#1d4ed8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value: unknown) => formatCurrency(Number(value))
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
            }
          }
        }
      }
    };

    return config;
  }, [budgetRows, categoryLookup]);

  const categoryBreakdownConfig = useMemo<ChartUnionConfig | null>(() => {
    if (categorySpend.length === 0) {
      return null;
    }

    const labels = categorySpend.map((row) => categoryLookup.get(row.categoryId)?.name ?? 'Unknown');
    const data = categorySpend.map((row) => row.totalCents);
    const colors = labels.map((_, index) => categoryLookup.get(categorySpend[index].categoryId)?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]);

    const config: ChartConfiguration<'pie', number[], string> = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            label: 'Spend',
            data,
            backgroundColor: colors
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.label}: ${formatCurrency(context.parsed)}`
            }
          }
        }
      }
    };

    return config;
  }, [categorySpend, categoryLookup]);

  const trendConfig = useMemo<ChartUnionConfig | null>(() => {
    if (trend.length === 0) {
      return null;
    }

    const labels = trend.map((point) => format(new Date(`${point.month}-01`), 'MMM yyyy'));
    const data = trend.map((point) => point.totalCents);

    const config: ChartConfiguration<'line', number[], string> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total spend',
            data,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.15)',
            tension: 0.25,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: (value: unknown) => formatCurrency(Number(value))
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: any) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
            }
          }
        }
      }
    };

    return config;
  }, [trend]);

  const currentTrend = trend[trend.length - 1];
  const previousTrend = trend[trend.length - 2];
  const monthDifference = currentTrend && previousTrend ? currentTrend.totalCents - previousTrend.totalCents : null;
  const overBudget = budgetRows.find((row) => row.status === 'over');

  return (
    <article id="panel-reports" role="tabpanel" aria-labelledby="tab-reports" className="page">
      <header className="page__header">
        <h2 className="page__title">Spending reports</h2>
        <p className="page__subtitle">Surface trends and insights that celebrate progress before warnings.</p>
      </header>
      <div className="page__content stack stack--lg">
        <div className="filters">
          <MonthPicker month={month} onChange={setMonth} label="Month" />
          <div className="filters__field">
            <span className="filters__label">Insights</span>
            {monthDifference !== null ? (
              monthDifference <= 0 ? (
                <p className="filters__insight">
                  You’ve spent <Money amountCents={Math.abs(monthDifference)} tone="positive" /> less than last month.
                </p>
              ) : (
                <p className="filters__insight">
                  You’re over last month by <Money amountCents={monthDifference} tone="warning" />. Review big swings to stay on track.
                </p>
              )
            ) : (
              <p className="filters__insight">We’ll highlight month-over-month changes once you add expenses.</p>
            )}
          </div>
        </div>

        {overBudget ? (
          <div className="alert alert--warning" role="status">
            You’re over by{' '}
            <Money
              amountCents={Math.max(0, overBudget.actualCents - (overBudget.limitCents + overBudget.carryInCents))}
              tone="danger"
            />{' '}
            in {categoryLookup.get(overBudget.categoryId)?.name ?? 'this category'}. Review your notes or adjust next month’s budget.
          </div>
        ) : null}

        {error ? (
          <p className="card__empty" role="alert">
            {error}
          </p>
        ) : isLoading ? (
          <p className="card__empty">Loading reports…</p>
        ) : (
          <div className="reports-grid">
            <ChartCard
              title="Budget vs actual"
              description="Spot where you’re pacing ahead or need to adjust."
              configuration={budgetVsActualConfig}
            />
            <ChartCard
              title="Category breakdown"
              description="See which categories shape your month."
              configuration={categoryBreakdownConfig}
            />
            <ChartCard
              title="Trends"
              description="Track spending momentum over the last 12 months."
              configuration={trendConfig}
            />
          </div>
        )}
      </div>
    </article>
  );
}

function formatCurrency(value: number): string {
  const euros = Math.round(value);
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(euros / 100);
}
