import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel
}: ConfirmDialogProps): JSX.Element | null {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-dialog__backdrop" aria-hidden />
      <div className="confirm-dialog__content">
        <h2 id="confirm-title" className="confirm-dialog__title">
          {title}
        </h2>
        <p className="confirm-dialog__body">{body}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="button button--secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmRef}
            className={tone === 'danger' ? 'button button--danger' : 'button button--primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
