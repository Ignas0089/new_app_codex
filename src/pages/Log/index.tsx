import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { format } from 'date-fns';

import { ConfirmDialog } from '@components/ConfirmDialog';
import { Money } from '@components/Money';
import { MonthPicker } from '@components/MonthPicker';
import type { MonthKey } from '@domain/types';
import type { Category, Expense } from '@domain/types';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '@services/expense';
import { listCategories } from '@services/category';
import { parseEuroToCents } from '@utils/money';
import { getMonthKey } from '@utils/dates';

interface ExpenseFormState {
  amount: string;
  date: string;
  categoryId: string;
  note: string;
}

interface UndoState {
  message: string;
  actionLabel: string;
  handler: () => Promise<void>;
}

function buildInitialForm(categories: Category[]): ExpenseFormState {
  const today = format(new Date(), 'yyyy-MM-dd');
  const defaultCategory = categories[0]?.id ?? '';
  return { amount: '', date: today, categoryId: defaultCategory, note: '' };
}

const VIRTUALIZATION_THRESHOLD = 1000;
const ESTIMATED_ROW_HEIGHT = 56;
const TABLE_COLUMN_COUNT = 5;
const OVERSCAN = 8;
const DEFAULT_CONTAINER_HEIGHT = 480;

interface VirtualState {
  startIndex: number;
  endIndex: number;
  paddingTop: number;
  paddingBottom: number;
}

interface ExpenseRowProps extends HTMLAttributes<HTMLTableRowElement> {
  expense: Expense;
  categoryName: string;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const ExpenseRow = forwardRef<HTMLTableRowElement, ExpenseRowProps>(function ExpenseRow(
  { expense, categoryName, onEdit, onDelete, ...rest }: ExpenseRowProps,
  ref
) {
  return (
    <tr ref={ref} {...rest}>
      <td>{format(new Date(expense.date), 'dd MMM yyyy')}</td>
      <td>{categoryName}</td>
      <td>
        <Money amountCents={expense.amountCents} />
      </td>
      <td>{expense.note ?? '—'}</td>
      <td className="table__actions">
        <button
          type="button"
          className="link-button"
          onClick={() => onEdit(expense)}
          aria-label={`Edit expense from ${categoryName}`}
        >
          Edit
        </button>
        <button
          type="button"
          className="link-button link-button--danger"
          onClick={() => onDelete(expense)}
          aria-label={`Delete expense from ${categoryName}`}
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

export function LogPage(): JSX.Element {
  const [month, setMonth] = useState<MonthKey>(getMonthKey(new Date()));
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [formState, setFormState] = useState<ExpenseFormState>(() => buildInitialForm([]));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await listCategories();
        if (!active) {
          return;
        }
        setCategories(data);
        setFormState(buildInitialForm(data));
      } catch (cause) {
        if (!active) {
          return;
        }
        setError('Couldn’t load categories. Refresh the page to try again.');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listExpenses({
        month,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchTerm.trim() === '' ? undefined : searchTerm.trim()
      });
      setExpenses(data);
    } catch (cause) {
      setError('Couldn’t load expenses. Try again.');
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [month, categoryFilter, searchTerm]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'n' && !event.defaultPrevented) {
        const target = event.target as HTMLElement | null;
        if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
          return;
        }
        event.preventDefault();
        amountInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  const categoryNameById = useMemo(() => {
    return categories.reduce<Map<string, string>>((map, category) => {
      map.set(category.id, category.name);
      return map;
    }, new Map());
  }, [categories]);

  const shouldVirtualize = expenses.length >= VIRTUALIZATION_THRESHOLD;
  const rowHeightsRef = useRef<number[]>([]);
  const [virtualState, setVirtualState] = useState<VirtualState>({
    startIndex: 0,
    endIndex: 0,
    paddingTop: 0,
    paddingBottom: 0
  });

  const ensureRowHeights = useCallback(() => {
    if (!shouldVirtualize) {
      rowHeightsRef.current = [];
      return;
    }
    const current = rowHeightsRef.current;
    if (current.length !== expenses.length) {
      rowHeightsRef.current = expenses.map((_, index) => current[index] ?? ESTIMATED_ROW_HEIGHT);
    }
  }, [expenses, shouldVirtualize]);

  const computeVirtualState = useCallback(
    (scrollTop: number, containerHeight: number) => {
      if (!shouldVirtualize) {
        return {
          startIndex: 0,
          endIndex: expenses.length,
          paddingTop: 0,
          paddingBottom: 0
        };
      }

      ensureRowHeights();

      const heights = rowHeightsRef.current;
      const effectiveHeight = containerHeight > 0 ? containerHeight : DEFAULT_CONTAINER_HEIGHT;

      let totalHeight = 0;
      for (const height of heights) {
        totalHeight += height;
      }

      let startIndex = 0;
      let top = 0;
      while (startIndex < expenses.length && top + heights[startIndex] <= scrollTop) {
        top += heights[startIndex];
        startIndex += 1;
      }

      let endIndex = startIndex;
      let coveredHeight = 0;
      while (endIndex < expenses.length && coveredHeight < effectiveHeight) {
        coveredHeight += heights[endIndex];
        endIndex += 1;
      }

      startIndex = Math.max(0, startIndex - OVERSCAN);
      endIndex = Math.min(expenses.length, endIndex + OVERSCAN);

      let paddingTop = 0;
      for (let index = 0; index < startIndex; index += 1) {
        paddingTop += heights[index];
      }

      let renderedHeight = 0;
      for (let index = startIndex; index < endIndex; index += 1) {
        renderedHeight += heights[index];
      }

      const paddingBottom = Math.max(totalHeight - paddingTop - renderedHeight, 0);

      return {
        startIndex,
        endIndex,
        paddingTop,
        paddingBottom
      };
    },
    [ensureRowHeights, expenses, shouldVirtualize]
  );

  useEffect(() => {
    if (!shouldVirtualize) {
      rowHeightsRef.current = [];
      setVirtualState({
        startIndex: 0,
        endIndex: expenses.length,
        paddingTop: 0,
        paddingBottom: 0
      });
      return;
    }

    const container = tableContainerRef.current;
    const containerHeight = container?.clientHeight ?? DEFAULT_CONTAINER_HEIGHT;
    const scrollTop = container?.scrollTop ?? 0;
    setVirtualState(computeVirtualState(scrollTop, containerHeight));
  }, [computeVirtualState, expenses, shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const container = tableContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setVirtualState(computeVirtualState(container.scrollTop, container.clientHeight ?? DEFAULT_CONTAINER_HEIGHT));
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [computeVirtualState, shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize) {
      return;
    }

    const handleResize = () => {
      const container = tableContainerRef.current;
      if (!container) {
        return;
      }
      setVirtualState(computeVirtualState(container.scrollTop, container.clientHeight ?? DEFAULT_CONTAINER_HEIGHT));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [computeVirtualState, shouldVirtualize]);

  const registerRowMeasurement = useCallback(
    (index: number, element: HTMLTableRowElement | null) => {
      if (!element) {
        return;
      }

      const measuredHeight = element.getBoundingClientRect().height || ESTIMATED_ROW_HEIGHT;
      if (!Number.isFinite(measuredHeight)) {
        return;
      }

      if (rowHeightsRef.current.length <= index) {
        rowHeightsRef.current[index] = ESTIMATED_ROW_HEIGHT;
      }

      const storedHeight = rowHeightsRef.current[index];
      if (Math.abs(storedHeight - measuredHeight) > 0.5) {
        rowHeightsRef.current[index] = measuredHeight;
        if (shouldVirtualize) {
          const container = tableContainerRef.current;
          const containerHeight = container?.clientHeight ?? DEFAULT_CONTAINER_HEIGHT;
          const scrollTop = container?.scrollTop ?? 0;
          setVirtualState(computeVirtualState(scrollTop, containerHeight));
        }
      }
    },
    [computeVirtualState, shouldVirtualize]
  );

  const totalForMonth = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  }, [expenses]);

  const visibleVirtualizedExpenses = shouldVirtualize
    ? expenses.slice(virtualState.startIndex, virtualState.endIndex)
    : [];

  const handleFormChange: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = (
    event
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormState(buildInitialForm(categories));
    setEditingId(null);
    amountInputRef.current?.focus();
  }, [categories]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!formState.categoryId) {
      setFeedback('Pick a category to log this expense.');
      return;
    }

    const amountValue = formState.amount.trim();
    if (amountValue === '') {
      setFeedback('Enter an amount in euro cents.');
      return;
    }

    try {
      setIsSubmitting(true);
      const amountCents = parseEuroToCents(amountValue);
      const isoDate = new Date(`${formState.date}T00:00:00`).toISOString();
      const monthKey = getMonthKey(isoDate);
      const basePayload = {
        amountCents,
        date: isoDate,
        month: monthKey,
        categoryId: formState.categoryId,
        note: formState.note.trim() === '' ? undefined : formState.note.trim()
      };

      if (editingId) {
        const current = expenses.find((item) => item.id === editingId);
        if (!current) {
          setFeedback('This expense no longer exists.');
          setEditingId(null);
        } else {
          await updateExpense(editingId, basePayload);
          setFeedback('Expense updated. Nice catch.');
          setUndoState({
            message: 'Expense updated.',
            actionLabel: 'Undo',
            handler: async () => {
              await updateExpense(editingId, {
                amountCents: current.amountCents,
                date: current.date,
                month: current.month,
                categoryId: current.categoryId,
                note: current.note
              });
              setFeedback('Reverted your last change.');
              await loadExpenses();
            }
          });
        }
      } else {
        const expense = await createExpense(basePayload);
        setFeedback('Expense saved. You’re on track.');
        setUndoState({
          message: 'Expense saved.',
          actionLabel: 'Undo',
          handler: async () => {
            await deleteExpense(expense.id);
            setFeedback('Expense removed.');
            await loadExpenses();
          }
        });
      }

      resetForm();
      if (monthKey !== month) {
        setMonth(monthKey);
      } else {
        await loadExpenses();
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t save. Check the amount and try again.';
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormState({
      amount: (expense.amountCents / 100).toFixed(2),
      date: expense.date.slice(0, 10),
      categoryId: expense.categoryId,
      note: expense.note ?? ''
    });
    amountInputRef.current?.focus();
  };

  const handleDelete = (expense: Expense) => {
    setPendingDelete(expense);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteExpense(pendingDelete.id);
      setFeedback('Expense deleted.');
      const deletedExpense = pendingDelete;
      setUndoState({
        message: 'Expense deleted.',
        actionLabel: 'Undo',
        handler: async () => {
          await createExpense({
            id: deletedExpense.id,
            amountCents: deletedExpense.amountCents,
            date: deletedExpense.date,
            month: deletedExpense.month,
            categoryId: deletedExpense.categoryId,
            note: deletedExpense.note
          });
          setFeedback('Expense restored.');
          await loadExpenses();
        }
      });
      await loadExpenses();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t delete this expense. Try again.';
      setFeedback(message);
    } finally {
      setPendingDelete(null);
    }
  };

  const cancelDelete = () => {
    setPendingDelete(null);
  };

  const applyUndo = async () => {
    if (!undoState) {
      return;
    }
    const currentUndo = undoState;
    setUndoState(null);
    await currentUndo.handler();
    await loadExpenses();
  };

  return (
    <article id="panel-log" role="tabpanel" aria-labelledby="tab-log" className="page">
      <header className="page__header">
        <h2 className="page__title">Log expenses</h2>
        <p className="page__subtitle">Capture spending without friction and stay focused on what’s left.</p>
      </header>
      <div className="page__content stack stack--lg">
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Quick add</h3>
            <p className="card__hint">Press N to jump to amount anywhere on this page.</p>
          </div>
          <form className="form" onSubmit={handleSubmit}>
            <div className="form__grid">
              <label className="form__field">
                <span className="form__label">Amount</span>
                <input
                  ref={amountInputRef}
                  className="form__input"
                  name="amount"
                  value={formState.amount}
                  onChange={handleFormChange}
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-describedby="amount-help"
                  required
                />
                <span id="amount-help" className="form__help">
                  Example: € 12.50
                </span>
              </label>
              <label className="form__field">
                <span className="form__label">Date</span>
                <input
                  className="form__input"
                  type="date"
                  name="date"
                  value={formState.date}
                  onChange={handleFormChange}
                  required
                />
              </label>
              <label className="form__field">
                <span className="form__label">Category</span>
                <select
                  className="form__input"
                  name="categoryId"
                  value={formState.categoryId}
                  onChange={handleFormChange}
                  required
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form__field form__field--wide">
                <span className="form__label">Note</span>
                <textarea
                  className="form__input"
                  name="note"
                  value={formState.note}
                  rows={2}
                  maxLength={500}
                  onChange={handleFormChange}
                  placeholder="Add context so future you remembers why."
                />
              </label>
            </div>
            <div className="form__actions">
              {feedback ? <p className="form__feedback">{feedback}</p> : null}
              <div className="form__buttons">
                {editingId ? (
                  <>
                    <button type="submit" className="button button--primary" disabled={isSubmitting}>
                      Save changes
                    </button>
                    <button type="button" className="button button--ghost" onClick={resetForm}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="submit" className="button button--primary" disabled={isSubmitting}>
                    Add expense
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="filters">
          <MonthPicker month={month} onChange={setMonth} label="Month" />
          <label className="filters__field">
            <span className="filters__label">Category</span>
            <select
              className="form__input"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filters__field filters__field--grow">
            <span className="filters__label">Search notes</span>
            <input
              className="form__input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search notes"
            />
          </label>
        </div>

        <section className="card">
          <header className="card__header card__header--row">
            <h3 className="card__title">Latest entries</h3>
            <p className="card__meta">
              Total this month: <Money amountCents={totalForMonth} />
            </p>
          </header>
          {isLoading ? (
            <p className="card__empty">Loading expenses…</p>
          ) : error ? (
            <p className="card__empty" role="alert">
              {error}
            </p>
          ) : expenses.length === 0 ? (
            <p className="card__empty">No expenses yet. Log your first one to see your month take shape.</p>
          ) : (
            <div
              ref={tableContainerRef}
              className={`table-wrapper${shouldVirtualize ? ' table-wrapper--virtualized' : ''}`}
              role="region"
              aria-live="polite"
            >
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Category</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Note</th>
                    <th scope="col" className="table__actions">Actions</th>
                  </tr>
                </thead>
                <tbody data-testid="expenses-body" data-virtualized={shouldVirtualize}>
                  {shouldVirtualize ? (
                    <>
                      {virtualState.paddingTop > 0 ? (
                        <tr
                          className="table__spacer-row"
                          aria-hidden="true"
                          role="presentation"
                          key="virtual-padding-top"
                          style={{ height: `${virtualState.paddingTop}px` }}
                        >
                          <td className="table__spacer-cell" colSpan={TABLE_COLUMN_COUNT} />
                        </tr>
                      ) : null}
                      {visibleVirtualizedExpenses.map((expense, offset) => {
                        const index = virtualState.startIndex + offset;
                        const categoryName = categoryNameById.get(expense.categoryId) ?? 'Unknown';
                        const rowClassName = index % 2 === 1 ? 'table__row--striped' : undefined;

                        return (
                          <ExpenseRow
                            key={expense.id}
                            ref={(element) => registerRowMeasurement(index, element)}
                            expense={expense}
                            categoryName={categoryName}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            className={rowClassName}
                            data-index={index}
                            data-testid="expense-row"
                          />
                        );
                      })}
                      {virtualState.paddingBottom > 0 ? (
                        <tr
                          className="table__spacer-row"
                          aria-hidden="true"
                          role="presentation"
                          key="virtual-padding-bottom"
                          style={{ height: `${virtualState.paddingBottom}px` }}
                        >
                          <td className="table__spacer-cell" colSpan={TABLE_COLUMN_COUNT} />
                        </tr>
                      ) : null}
                    </>
                  ) : (
                    expenses.map((expense, index) => {
                      const categoryName = categoryNameById.get(expense.categoryId) ?? 'Unknown';
                      const rowClassName = index % 2 === 1 ? 'table__row--striped' : undefined;

                      return (
                        <ExpenseRow
                          key={expense.id}
                          expense={expense}
                          categoryName={categoryName}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          className={rowClassName}
                          data-testid="expense-row"
                        />
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {undoState ? (
          <div className="undo-banner" role="status">
            <span>{undoState.message}</span>
            <button type="button" className="button button--ghost" onClick={applyUndo}>
              {undoState.actionLabel}
            </button>
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Delete expense"
        body="This removes the expense permanently. You can undo right away if needed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </article>
  );
}
