import { useCallback, useEffect, useRef, useState, type ChangeEventHandler, type FormEvent } from 'react';

import { ConfirmDialog } from '@components/ConfirmDialog';
import type { Category } from '@domain/types';
import { exportBackup, importBackup, clearAllData } from '@services/backup';
import { createCategory, deleteCategory, listCategories, updateCategory, setCategoryHidden } from '@services/category';

interface CategoryDraft {
  name: string;
  color: string;
  isHidden: boolean;
  dirty: boolean;
  saving: boolean;
}

type ConfirmState =
  | { type: 'clear' }
  | { type: 'delete-category'; category: Category }
  | null;

export function SettingsPage(): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#2563eb');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const syncDrafts = useCallback((items: Category[]) => {
    setDrafts(() =>
      items.reduce<Record<string, CategoryDraft>>((acc, category) => {
        acc[category.id] = {
          name: category.name,
          color: category.color ?? '#2563eb',
          isHidden: category.isHidden,
          dirty: false,
          saving: false
        };
        return acc;
      }, {})
    );
  }, []);

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCategories({ includeHidden: true });
      setCategories(data);
      syncDrafts(data);
    } catch (cause) {
      setError('Couldn’t load categories. Refresh to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [syncDrafts]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleDraftChange = (id: string, patch: Partial<CategoryDraft>) => {
    setDrafts((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...patch,
        dirty: true
      }
    }));
  };

  const handleSaveCategory = async (category: Category) => {
    const draft = drafts[category.id];
    if (!draft) {
      return;
    }
    setDrafts((previous) => ({
      ...previous,
      [category.id]: { ...previous[category.id], saving: true }
    }));

    try {
      await updateCategory(category.id, {
        name: draft.name,
        color: draft.color,
        isHidden: draft.isHidden
      });
      setFeedback('Category saved.');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t save category.';
      setFeedback(message);
      setDrafts((previous) => ({
        ...previous,
        [category.id]: { ...previous[category.id], saving: false }
      }));
    }
  };

  const handleToggleHidden = async (category: Category, nextHidden: boolean) => {
    setDrafts((previous) => ({
      ...previous,
      [category.id]: { ...previous[category.id], saving: true }
    }));
    try {
      await setCategoryHidden(category.id, nextHidden);
      setFeedback(nextHidden ? 'Category hidden.' : 'Category visible.');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t update visibility.';
      setFeedback(message);
      setDrafts((previous) => ({
        ...previous,
        [category.id]: { ...previous[category.id], saving: false }
      }));
    }
  };

  const handleCreateCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (newCategoryName.trim() === '') {
      setFeedback('Give the category a name.');
      return;
    }

    try {
      await createCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setFeedback('Category added.');
      setNewCategoryName('');
      setNewCategoryColor('#2563eb');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t create category.';
      setFeedback(message);
    }
  };

  const handleDeleteCategory = (category: Category) => {
    setConfirmState({ type: 'delete-category', category });
  };

  const confirmDeletion = async () => {
    if (!confirmState || confirmState.type !== 'delete-category') {
      return;
    }
    try {
      await deleteCategory(confirmState.category.id);
      setFeedback('Category deleted.');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Couldn’t delete category. It may have expenses attached.';
      setFeedback(message);
    } finally {
      setConfirmState(null);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportBackup();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `simple-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback('Backup exported. Save it somewhere safe.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Export failed. Try again.';
      setFeedback(message);
    }
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const onImportFileChange: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importBackup(payload, { merge: false });
      setFeedback('Backup imported. Data refreshed.');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Import failed. Check the file and try again.';
      setFeedback(message);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = () => {
    setConfirmState({ type: 'clear' });
  };

  const confirmClear = async () => {
    try {
      await clearAllData();
      setFeedback('All data cleared.');
      await loadCategories();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Clear failed. Try again.';
      setFeedback(message);
    } finally {
      setConfirmState(null);
    }
  };

  return (
    <article id="panel-settings" role="tabpanel" aria-labelledby="tab-settings" className="page">
      <header className="page__header">
        <h2 className="page__title">Settings</h2>
        <p className="page__subtitle">Keep data safe, tailor categories, and stay confident in your backups.</p>
      </header>
      <div className="page__content stack stack--lg">
        <section className="card">
          <header className="card__header card__header--row">
            <h3 className="card__title">Data control</h3>
            {feedback ? <p className="card__feedback">{feedback}</p> : null}
          </header>
          <div className="settings-actions">
            <button type="button" className="button button--primary" onClick={handleExport}>
              Export data
            </button>
            <button type="button" className="button button--secondary" onClick={handleImport}>
              Import data
            </button>
            <button type="button" className="button button--danger" onClick={handleClearData}>
              Clear all data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={onImportFileChange}
              className="sr-only"
            />
            <p className="settings-actions__hint">Importing replaces current data. This can’t be undone.</p>
          </div>
        </section>

        <section className="card">
          <header className="card__header">
            <h3 className="card__title">Manage categories</h3>
            <p className="card__hint">Keep your list tidy so reports stay meaningful.</p>
          </header>
          {isLoading ? (
            <p className="card__empty">Loading categories…</p>
          ) : error ? (
            <p className="card__empty" role="alert">
              {error}
            </p>
          ) : categories.length === 0 ? (
            <p className="card__empty">No categories yet. Add your first one to organise budgets.</p>
          ) : (
            <ul className="category-list">
              {categories.map((category) => {
                const draft = drafts[category.id];
                return (
                  <li key={category.id} className="category-item">
                    <div className="category-item__main">
                      <input
                        className="form__input"
                        value={draft?.name ?? category.name}
                        onChange={(event) => handleDraftChange(category.id, { name: event.target.value })}
                      />
                      <input
                        className="form__input category-item__color"
                        type="color"
                        value={draft?.color ?? category.color ?? '#2563eb'}
                        onChange={(event) => handleDraftChange(category.id, { color: event.target.value })}
                        aria-label="Category colour"
                      />
                      <label className="category-item__toggle">
                        <input
                          type="checkbox"
                          checked={draft?.isHidden ?? category.isHidden}
                          onChange={(event) => handleToggleHidden(category, event.target.checked)}
                        />
                        <span>Hidden</span>
                      </label>
                    </div>
                    <div className="category-item__actions">
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => handleSaveCategory(category)}
                        disabled={!draft?.dirty || draft.saving}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="button button--ghost"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <form className="category-new" onSubmit={handleCreateCategory}>
            <h4 className="category-new__title">Add category</h4>
            <div className="category-new__fields">
              <input
                className="form__input"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                maxLength={40}
              />
              <input
                className="form__input category-item__color"
                type="color"
                value={newCategoryColor}
                onChange={(event) => setNewCategoryColor(event.target.value)}
                aria-label="Category colour"
              />
              <button type="submit" className="button button--primary">
                Add
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <header className="card__header">
            <h3 className="card__title">Support</h3>
            <p className="card__hint">Need help? Email support@simpleledger.app</p>
          </header>
          <a className="link-button" href="mailto:support@simpleledger.app">
            Email support
          </a>
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmState?.type === 'clear'}
        title="Clear all data"
        body="This removes every expense and budget from this device. This can’t be undone. Make sure you’ve exported first."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={confirmClear}
        onCancel={() => setConfirmState(null)}
      />
      <ConfirmDialog
        isOpen={confirmState?.type === 'delete-category'}
        title="Delete category"
        body="Deleting a category removes it permanently. Only proceed if it has no expenses."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={confirmDeletion}
        onCancel={() => setConfirmState(null)}
      />
    </article>
  );
}
