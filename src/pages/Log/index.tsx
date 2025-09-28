import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

  const totalForMonth = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  }, [expenses]);

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
            <div className="table-wrapper" role="region" aria-live="polite">
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
                <tbody>
                  {expenses.map((expense) => {
                    const categoryName = categories.find((category) => category.id === expense.categoryId)?.name ??
                      'Unknown';
                    return (
                      <tr key={expense.id}>
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
                            onClick={() => handleEdit(expense)}
                            aria-label={`Edit expense from ${categoryName}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="link-button link-button--danger"
                            onClick={() => handleDelete(expense)}
                            aria-label={`Delete expense from ${categoryName}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
