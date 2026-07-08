import { CSSProperties, InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, onChange, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-[var(--vk-text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          onChange={onChange}
          style={
            error
              ? ({ paddingRight: `max(9rem, ${error.length * 0.65 + 2}rem)` } as CSSProperties)
              : undefined
          }
          className={`w-full select-text rounded-[var(--vk-radius-sm)] border bg-white px-4 py-2.5 text-[var(--vk-text-primary)] transition-[var(--vk-transition)] placeholder:text-[var(--vk-text-secondary)] focus:outline-none ${
            error
              ? 'border-[var(--vk-danger)] focus:border-[var(--vk-danger)] focus:ring-2 focus:ring-[var(--vk-danger)]/15'
              : 'border-[var(--vk-border)] focus:border-[var(--vk-primary)] focus:ring-2 focus:ring-[var(--vk-primary)]/20'
          }`}
          {...props}
        />
        {error && (
          <span
            className="pointer-events-none absolute inset-y-0 right-3 flex max-w-[calc(100%-4.5rem)] items-center justify-end text-right text-xs leading-tight text-[var(--vk-danger)]"
            aria-live="polite"
          >
            <span className="whitespace-nowrap">{error}</span>
          </span>
        )}
      </div>
    </div>
  );
}
