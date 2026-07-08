'use client';

import { useEffect, useId, useRef, useState } from 'react';

interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-[1.125rem] w-[1.125rem] shrink-0 text-[var(--vk-text-secondary)] transition-transform duration-200 ${open ? 'rotate-180 text-[var(--vk-primary)]' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Select({ label, options, value, onChange, className = '', id }: SelectProps) {
  const autoId = useId();
  const selectId = id || autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={`space-y-1 ${className}`} ref={rootRef}>
      {label && (
        <label id={`${selectId}-label`} className="block text-sm font-medium text-[var(--vk-text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${selectId}-label` : undefined}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-3 rounded-[var(--vk-radius-sm)] border bg-white px-4 py-2.5 text-left text-[var(--vk-text-primary)] transition-[var(--vk-transition)] ${
            open
              ? 'border-[var(--vk-primary)] ring-2 ring-[var(--vk-primary)]/20'
              : 'border-[var(--vk-border)] hover:border-[var(--vk-primary)]/40'
          }`}
        >
          <span className="truncate">{selected?.label}</span>
          <Chevron open={open} />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-labelledby={label ? `${selectId}-label` : undefined}
            className="absolute z-20 mt-1.5 max-h-60 w-full overflow-auto rounded-[var(--vk-radius-sm)] border border-[var(--vk-border-light)] bg-white py-1 shadow-[var(--vk-shadow-md)]"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-[var(--vk-transition)] ${
                      active
                        ? 'bg-[var(--vk-primary)]/10 font-medium text-[var(--vk-primary)]'
                        : 'text-[var(--vk-text-primary)] hover:bg-[var(--vk-bg-hover)]'
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
