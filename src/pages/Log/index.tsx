import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';

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

interface EditableRowState {
  amount: string;
  date: string;
  categoryId: string;
  note: string;
}

const columnHelper = createColumnHelper<Expense>();

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
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const [editingRows, setEditingRows] = useState<Record<string, EditableRowState>>({});
  const [savingRows, setSavingRows] = useState<Record<string, boolean>>({});
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);

  const amountInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushUndo = useCallback((undo: UndoState) => {
    setUndoStack((previous) => [...previous, undo]);
  }, []);

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
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    if (undoStack.length === 0) {
      return;
    }
    undoTimerRef.current = setTimeout(() => {
      setUndoStack((previous) => previous.slice(0, -1));
    }, 8000);

    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, [undoStack]);

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

  useEffect(() => {
    if (expenses.length === 0) {
      setFocusedRowId(null);
      return;
    }
    setFocusedRowId((previous) => {
      if (previous && expenses.some((expense) => expense.id === previous)) {
        return previous;
      }
      return expenses[0].id;
    });
  }, [expenses]);

  const registerRowRef = useCallback((rowId: string, element: HTMLTableRowElement | null) => {
    if (element) {
      rowRefs.current.set(rowId, element);
    } else {
      rowRefs.current.delete(rowId);
    }
  }, []);

  const focusRow = useCallback((rowId: string) => {
    const row = rowRefs.current.get(rowId);
    if (row && document.activeElement !== row) {
      row.focus();
    }
  }, []);

  useEffect(() => {
    if (!focusedRowId) {
      return;
    }
    if (editingRows[focusedRowId]) {
      return;
    }
    focusRow(focusedRowId);
  }, [focusedRowId, editingRows, focusRow]);

  const focusRowEditor = useCallback((rowId: string) => {
    requestAnimationFrame(() => {
      const row = rowRefs.current.get(rowId);
      if (!row) {
        return;
      }
      const control = row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input, select, textarea'
      );
      control?.focus();
    });
  }, []);

  const stopEditingRow = useCallback(
    (rowId: string) => {
      setEditingRows((previous) => {
        if (!previous[rowId]) {
          return previous;
        }
        const next = { ...previous };
        delete next[rowId];
        return next;
      });
      setSavingRows((previous) => {
        if (!previous[rowId]) {
          return previous;
        }
        const next = { ...previous };
        delete next[rowId];
        return next;
      });
      setFocusedRowId(rowId);
      focusRow(rowId);
    },
    [focusRow]
  );

  const handleInlineChange = useCallback((rowId: string, field: keyof EditableRowState, value: string) => {
    setEditingRows((previous) => {
      const existing = previous[rowId];
      if (!existing) {
        return previous;
      }
      return {
        ...previous,
        [rowId]: { ...existing, [field]: value }
      };
    });
  }, []);

  const handleInlineEdit = useCallback(
    (expense: Expense) => {
      setEditingRows((previous) => {
        if (previous[expense.id]) {
          return previous;
        }
        return {
          ...previous,
          [expense.id]: {
            amount: (expense.amountCents / 100).toFixed(2),
            date: expense.date.slice(0, 10),
            categoryId: expense.categoryId,
            note: expense.note ?? ''
          }
        };
      });
      setFocusedRowId(expense.id);
      window.setTimeout(() => {
        focusRowEditor(expense.id);
      }, 0);
    },
    [focusRowEditor]
  );

  const handleInlineCancel = useCallback(
    (rowId: string) => {
      stopEditingRow(rowId);
    },
    [stopEditingRow]
  );

  const handleInlineSave = useCallback(
    async (rowId: string) => {
      const draft = editingRows[rowId];
      if (!draft) {
        return;
      }
      const current = expenses.find((expense) => expense.id === rowId);
      if (!current) {
        setFeedback('This expense no longer exists.');
        stopEditingRow(rowId);
        return;
      }
      if (!draft.categoryId) {
        setFeedback('Pick a category to log this expense.');
        return;
      }
      const amountValue = draft.amount.trim();
      if (amountValue === '') {
        setFeedback('Enter an amount in euro cents.');
        return;
      }
      try {
        setSavingRows((previous) => ({ ...previous, [rowId]: true }));
        const amountCents = parseEuroToCents(amountValue);
        const isoDate = new Date(`${draft.date}T00:00:00`).toISOString();
        const monthKey = getMonthKey(isoDate);
        await updateExpense(rowId, {
          amountCents,
          date: isoDate,
          month: monthKey,
          categoryId: draft.categoryId,
          note: draft.note.trim() === '' ? undefined : draft.note.trim()
        });
        setFeedback('Expense updated. Nice catch.');
        pushUndo({
          message: 'Expense updated.',
          actionLabel: 'Undo',
          handler: async () => {
            await updateExpense(rowId, {
              amountCents: current.amountCents,
              date: current.date,
              month: current.month,
              categoryId: current.categoryId,
              note: current.note
            });
            setFeedback('Reverted your last change.');
          }
        });
        stopEditingRow(rowId);
        if (monthKey !== month) {
          setMonth(monthKey);
        } else {
          await loadExpenses();
        }
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Couldn’t save. Check the amount and try again.';
        setFeedback(message);
      } finally {
        setSavingRows((previous) => {
          const next = { ...previous };
          delete next[rowId];
          return next;
        });
      }
    },
    [editingRows, expenses, loadExpenses, month, pushUndo, stopEditingRow]
  );

  const handleFormChange: React.ChangeEventHandler<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  > = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = useCallback(() => {
    setFormState(buildInitialForm(categories));
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

      const expense = await createExpense(basePayload);
      setFeedback('Expense saved. You’re on track.');
      pushUndo({
        message: 'Expense saved.',
        actionLabel: 'Undo',
        handler: async () => {
          await deleteExpense(expense.id);
          setFeedback('Expense removed.');
        }
      });

      resetForm();
      if (monthKey !== month) {
        setMonth(monthKey);
      } else {
        await loadExpenses();
      }
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Couldn’t save. Check the amount and try again.';
      setFeedback(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback((expense: Expense) => {
    setPendingDelete(expense);
    setFocusedRowId(expense.id);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) {
      return;
    }
    try {
      await deleteExpense(pendingDelete.id);
      setFeedback('Expense deleted.');
      const deletedExpense = pendingDelete;
      pushUndo({
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
        }
      });
      await loadExpenses();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Couldn’t delete this expense. Try again.';
      setFeedback(message);
    } finally {
      setPendingDelete(null);
    }
  }, [pendingDelete, pushUndo, loadExpenses]);

  const cancelDelete = useCallback(() => {
    if (pendingDelete) {
      focusRow(pendingDelete.id);
    }
    setPendingDelete(null);
  }, [pendingDelete, focusRow]);

  const handleTableKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const target = event.target as HTMLElement;
      const tagName = target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tagName)) {
        return;
      }
      const currentRowElement = target.closest<HTMLTableRowElement>('[data-row-id]');
      const rowElement = currentRowElement ?? (focusedRowId ? rowRefs.current.get(focusedRowId) ?? null : null);
      if (!rowElement) {
        return;
      }
      const rowId = rowElement.dataset.rowId;
      if (!rowId) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const index = expenses.findIndex((expense) => expense.id === rowId);
        if (index >= 0 && index < expenses.length - 1) {
          const nextExpense = expenses[index + 1];
          setFocusedRowId(nextExpense.id);
          focusRow(nextExpense.id);
        }
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        const index = expenses.findIndex((expense) => expense.id === rowId);
        if (index > 0) {
          const previousExpense = expenses[index - 1];
          setFocusedRowId(previousExpense.id);
          focusRow(previousExpense.id);
        }
        return;
      }
      if (event.key.toLowerCase() === 'e') {
        if (editingRows[rowId]) {
          return;
        }
        event.preventDefault();
        const expense = expenses.find((item) => item.id === rowId);
        if (expense) {
          handleInlineEdit(expense);
        }
        return;
      }
      if (event.key === 'Delete') {
        event.preventDefault();
        const expense = expenses.find((item) => item.id === rowId);
        if (expense) {
          handleDelete(expense);
        }
      }
    },
    [editingRows, expenses, focusRow, focusedRowId, handleDelete, handleInlineEdit]
  );

  const totalForMonth = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  }, [expenses]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'date',
        header: () => 'Date',
        cell: ({ row }) => {
          const expense = row.original;
          const editState = editingRows[expense.id];
          if (editState) {
            return (
              <input
                className="form__input"
                type="date"
                value={editState.date}
                onChange={(event) => handleInlineChange(expense.id, 'date', event.target.value)}
                aria-label={`Date for ${format(new Date(expense.date), 'dd MMM yyyy')}`}
              />
            );
          }
          return format(new Date(expense.date), 'dd MMM yyyy');
        }
      }),
      columnHelper.display({
        id: 'category',
        header: () => 'Category',
        cell: ({ row }) => {
          const expense = row.original;
          const editState = editingRows[expense.id];
          const categoryName =
            categories.find((category) => category.id === expense.categoryId)?.name ?? 'Unknown';
          if (editState) {
            return (
              <select
                className="form__input"
                value={editState.categoryId}
                onChange={(event) => handleInlineChange(expense.id, 'categoryId', event.target.value)}
                aria-label={`Category for ${categoryName}`}
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
            );
          }
          return categoryName;
        }
      }),
      columnHelper.display({
        id: 'amount',
        header: () => 'Amount',
        cell: ({ row }) => {
          const expense = row.original;
          const editState = editingRows[expense.id];
          const categoryName =
            categories.find((category) => category.id === expense.categoryId)?.name ?? 'expense';
          if (editState) {
            return (
              <input
                className="form__input"
                value={editState.amount}
                onChange={(event) => handleInlineChange(expense.id, 'amount', event.target.value)}
                inputMode="decimal"
                aria-label={`Amount for ${categoryName}`}
              />
            );
          }
          return <Money amountCents={expense.amountCents} />;
        }
      }),
      columnHelper.display({
        id: 'note',
        header: () => 'Note',
        cell: ({ row }) => {
          const expense = row.original;
          const editState = editingRows[expense.id];
          if (editState) {
            return (
              <textarea
                className="form__input"
                value={editState.note}
                onChange={(event) => handleInlineChange(expense.id, 'note', event.target.value)}
                rows={2}
                maxLength={500}
                aria-label="Note"
              />
            );
          }
          return expense.note ?? '—';
        }
      }),
      columnHelper.display({
        id: 'actions',
        header: () => 'Actions',
        cell: ({ row }) => {
          const expense = row.original;
          const editState = editingRows[expense.id];
          const isSaving = Boolean(savingRows[expense.id]);
          if (editState) {
            return (
              <div className="table__actions">
                <button
                  type="button"
                  className="button button--primary"
                  onClick={() => handleInlineSave(expense.id)}
                  disabled={isSaving}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => handleInlineCancel(expense.id)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            );
          }
          const categoryName =
            categories.find((category) => category.id === expense.categoryId)?.name ?? 'expense';
          return (
            <div className="table__actions">
              <button
                type="button"
                className="link-button"
                onClick={() => handleInlineEdit(expense)}
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
            </div>
          );
        }
      })
    ],
    [categories, editingRows, handleDelete, handleInlineCancel, handleInlineChange, handleInlineEdit, handleInlineSave, savingRows]
  );

  const table = useReactTable({
    data: expenses,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const latestUndo = undoStack[undoStack.length - 1] ?? null;
  const pendingUndoCount = undoStack.length > 0 ? undoStack.length - 1 : 0;

  const applyUndo = useCallback(async () => {
    let latestAction: UndoState | undefined;
    setUndoStack((previous) => {
      if (previous.length === 0) {
        latestAction = undefined;
        return previous;
      }
      const next = [...previous];
      latestAction = next.pop();
      return next;
    });
    if (!latestAction) {
      return;
    }
    await latestAction.handler();
    await loadExpenses();
  }, [loadExpenses]);

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
                <button type="submit" className="button button--primary" disabled={isSubmitting}>
                  Add expense
                </button>
                <button type="button" className="button button--ghost" onClick={resetForm}>
                  Clear
                </button>
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
              className="table-wrapper"
              role="region"
              aria-live="polite"
              data-testid="expense-table"
              onKeyDown={handleTableKeyDown}
            >
              <table className="table">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          scope="col"
                          className={header.column.id === 'actions' ? 'table__actions' : undefined}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => {
                    const expense = row.original;
                    const isEditing = Boolean(editingRows[expense.id]);
                    return (
                      <tr
                        key={row.id}
                        data-row-id={expense.id}
                        tabIndex={isEditing ? -1 : 0}
                        ref={(element) => registerRowRef(expense.id, element)}
                        onFocus={() => setFocusedRowId(expense.id)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className={cell.column.id === 'actions' ? 'table__actions' : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {latestUndo ? (
          <div className="undo-banner" role="status">
            <span>
              {latestUndo.message}
              {pendingUndoCount > 0 ? ` (${pendingUndoCount} more)` : ''}
            </span>
            <button type="button" className="button button--ghost" onClick={applyUndo}>
              {latestUndo.actionLabel}
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
