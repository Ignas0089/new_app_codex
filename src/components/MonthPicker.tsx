import { forwardRef, useImperativeHandle, useRef } from 'react';

import type { MonthKey } from '@domain/types';
import { getNextMonthKey, getPreviousMonthKey } from '@utils/dates';

export interface MonthPickerProps {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
  minMonth?: MonthKey;
  maxMonth?: MonthKey;
  id?: string;
  label?: string;
}

export interface MonthPickerHandle {
  focus: () => void;
}

export const MonthPicker = forwardRef<MonthPickerHandle, MonthPickerProps>(function MonthPicker(
  { month, onChange, minMonth, maxMonth, id, label }: MonthPickerProps,
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  const canGoPrev = !minMonth || getPreviousMonthKey(month) >= minMonth;
  const canGoNext = !maxMonth || getNextMonthKey(month) <= maxMonth;

  const handlePrevious = () => {
    if (canGoPrev) {
      onChange(getPreviousMonthKey(month));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onChange(getNextMonthKey(month));
    }
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    onChange(event.target.value as MonthKey);
  };

  return (
    <div className="month-picker" aria-live="polite">
      {label ? (
        <label className="month-picker__label" htmlFor={id ?? 'month-picker-input'}>
          {label}
        </label>
      ) : null}
      <div className="month-picker__controls">
        <button
          type="button"
          className="button button--ghost"
          onClick={handlePrevious}
          disabled={!canGoPrev}
          aria-label="Previous month"
        >
          ‹
        </button>
        <input
          ref={inputRef}
          id={id ?? 'month-picker-input'}
          className="month-picker__input"
          type="month"
          value={month}
          min={minMonth}
          max={maxMonth}
          onChange={handleInputChange}
          aria-live="polite"
        />
        <button
          type="button"
          className="button button--ghost"
          onClick={handleNext}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          ›
        </button>
      </div>
    </div>
  );
});
