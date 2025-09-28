import { useCallback, useEffect, useMemo, useState } from 'react';

import { Money } from '@components/Money';
import { MonthPicker } from '@components/MonthPicker';
import type { MonthKey } from '@domain/types';
import type { Budget, BudgetSnapshot, Category } from '@domain/types';
import { createBudget, listBudgets, updateBudget } from '@services/budget';
import { listCategories } from '@services/category';
import { parseEuroToCents } from '@utils/money';
import { useBudgetBadges } from '@utils/useBudgetBadges';
import { getMonthKey } from '@utils/dates';

interface BudgetRowState {
  category: Category;
  budget: Budget | null;
  limitInput: string;
  carryOverPrev: boolean;
  isSaving: boolean;
  isDirty: boolean;
}

function formatLimitInput(budget: Budget | null): string {
  if (!budget) {
    return '';
  }
  return (budget.limitCents / 100).toFixed(2);
}

function renderStatusCopy(snapshot: BudgetSnapshot | undefined): JSX.Element {
  if (!snapshot) {
    return (
      <>
        <Money amountCents={0} /> left
      </>
    );
  }

  if (snapshot.status === 'over') {
    return (
      <>
        Over by <Money amountCents={Math.abs(snapshot.availableCents)} />. Consider adjusting next month.
      </>
    );
  }

  return snapshot.status === 'approaching' ? (
    <>
      <Money amountCents={snapshot.availableCents} /> left—steady as you go.
    </>
  ) : (
    <>
      <Money amountCents={snapshot.availableCents} /> left
    </>
  );
}

export function BudgetsPage(): JSX.Element {
  const [month, setMonth] = useState<MonthKey>(getMonthKey(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<BudgetRowState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { badges, isLoading: badgesLoading, refresh: refreshBadges } = useBudgetBadges(month);

  const loadCategories = useCallback(async () => {
    setError(null);
    try {
      const data = await listCategories();
      setCategories(data);
    } catch (cause) {
      setError('Couldn’t load categories. Refresh to try again.');
    }
  }, []);

  const loadBudgets = useCallback(async () => {
    if (categories.length === 0) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const budgets = await listBudgets({ month });
      const budgetMap = new Map(budgets.map((budget) => [budget.categoryId, budget] as const));
      setRows(
        categories.map((category) => {
          const budget = budgetMap.get(category.id) ?? null;
          return {
            category,
            budget,
            limitInput: formatLimitInput(budget),
            carryOverPrev: budget?.carryOverPrev ?? false,
            isSaving: false,
            isDirty: false
          };
        })
      );
    } catch (cause) {
      setError('Couldn’t load budgets. Try again.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [categories, month]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (categories.length > 0) {
      void loadBudgets();
    }
  }, [categories, loadBudgets]);

  useEffect(() => {
    void refreshBadges();
  }, [month, refreshBadges]);

  const handleLimitChange = (categoryId: string, value: string) => {
    setRows((previous) =>
      previous.map((row) =>
        row.category.id === categoryId
          ? {
              ...row,
              limitInput: value,
              isDirty: true
            }
          : row
      )
    );
  };

  const handleCarryOverChange = (categoryId: string, checked: boolean) => {
    setRows((previous) =>
      previous.map((row) =>
        row.category.id === categoryId
          ? {
              ...row,
              carryOverPrev: checked,
              isDirty: true
            }
          : row
      )
    );
  };

  const handleSaveRow = async (categoryId: string) => {
    const row = rows.find((item) => item.category.id === categoryId);
    if (!row) {
      return;
    }

    const limitCents = row.limitInput.trim() === '' ? 0 : parseEuroToCents(row.limitInput);

    setRows((previous) =>
      previous.map((item) =>
        item.category.id === categoryId
          ? {
              ...item,
              isSaving: true
            }
          : item
      )
    );

    try {
      if (row.budget) {
        await updateBudget(row.budget.id, {
          limitCents,
          carryOverPrev: row.carryOverPrev
        });
      } else {
        await createBudget({
          month,
          categoryId,
          limitCents,
          carryOverPrev: row.carryOverPrev
        });
      }
      setFeedback('Budget saved. You’re in control.');
      await loadBudgets();
      await refreshBadges();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t save budget. Try again.';
      setFeedback(message);
      setRows((previous) =>
        previous.map((item) =>
          item.category.id === categoryId
            ? {
                ...item,
                isSaving: false
              }
            : item
        )
      );
    }
  };

  const badgeLookup = useMemo(() => {
    const map = new Map<string, typeof badges[number]>();
    for (const badge of badges) {
      map.set(badge.categoryId, badge);
    }
    return map;
  }, [badges]);

  return (
    <article id="panel-budgets" role="tabpanel" aria-labelledby="tab-budgets" className="page">
      <header className="page__header">
        <h2 className="page__title">Monthly budgets</h2>
        <p className="page__subtitle">Adjust limits, carry over what’s left, and keep status badges calm.</p>
      </header>
      <div className="page__content stack stack--lg">
        <div className="filters">
          <MonthPicker month={month} onChange={setMonth} label="Month" />
          <div className="filters__field">
            <span className="filters__label">Status badges</span>
            <button type="button" className="button button--ghost" onClick={() => refreshBadges()}>
              Refresh
            </button>
          </div>
        </div>

        <section className="card">
          <header className="card__header card__header--row">
            <div>
              <h3 className="card__title">Adjust budgets</h3>
              <p className="card__hint">Updates apply to {formatMonth(month)}.</p>
            </div>
            {feedback ? <p className="card__feedback">{feedback}</p> : null}
          </header>
          {isLoading || badgesLoading ? (
            <p className="card__empty">Loading budgets…</p>
          ) : error ? (
            <p className="card__empty" role="alert">
              {error}
            </p>
          ) : categories.length === 0 ? (
            <p className="card__empty">No budgets yet. Set targets so you know what’s left at a glance.</p>
          ) : (
            <div className="budget-grid">
              {rows.map((row) => {
                const badge = badgeLookup.get(row.category.id);
                const availableCents = badge?.availableCents ?? 0;
                const statusTone = badge
                  ? badge.status === 'over'
                    ? 'danger'
                    : badge.status === 'approaching'
                    ? 'warning'
                    : 'positive'
                  : 'default';
                return (
                  <article key={row.category.id} className="budget-card">
                    <header className="budget-card__header">
                      <h4 className="budget-card__title">{row.category.name}</h4>
                      <span className={`badge badge--${badge?.status ?? 'idle'}`}>
                        {renderStatusCopy(badge)}
                      </span>
                    </header>
                    <dl className="budget-card__stats">
                      <div>
                        <dt>Limit</dt>
                        <dd>
                          <Money amountCents={row.budget?.limitCents ?? 0} />
                        </dd>
                      </div>
                      <div>
                        <dt>Spent</dt>
                        <dd>
                          <Money amountCents={badge?.actualCents ?? 0} />
                        </dd>
                      </div>
                      <div>
                        <dt>Available</dt>
                        <dd>
                          <Money amountCents={availableCents} tone={statusTone} />
                        </dd>
                      </div>
                    </dl>
                    <div className="budget-card__form">
                      <label className="form__field">
                        <span className="form__label">Monthly limit</span>
                        <input
                          className="form__input"
                          value={row.limitInput}
                          onChange={(event) => handleLimitChange(row.category.id, event.target.value)}
                          inputMode="decimal"
                          placeholder="0.00"
                        />
                      </label>
                      <label className="form__field form__field--inline">
                        <input
                          type="checkbox"
                          checked={row.carryOverPrev}
                          onChange={(event) => handleCarryOverChange(row.category.id, event.target.checked)}
                        />
                        <div>
                          <span className="form__label">Carry over leftover?</span>
                          <span className="form__help">Keeps unused budget for next month.</span>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => handleSaveRow(row.category.id)}
                        disabled={row.isSaving || !row.isDirty}
                      >
                        {row.budget ? 'Save changes' : 'Create budget'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function formatMonth(month: MonthKey): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
