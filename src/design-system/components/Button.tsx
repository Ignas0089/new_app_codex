import { forwardRef, ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const join = (...parts: Array<string | false | undefined>) =>
  parts.filter(Boolean).join(' ');

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      isLoading = false,
      disabled,
      fullWidth = false,
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={join(
          'ds-button',
          `ds-button--${variant}`,
          isLoading && 'ds-button--loading',
          fullWidth && 'ds-button--block',
          className
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
