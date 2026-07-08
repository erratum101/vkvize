import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string;
  title?: string;
}

export function Checkbox({ className = '', title, ...props }: CheckboxProps) {
  return (
    <label className={`vk-checkbox inline-flex shrink-0 cursor-pointer ${className}`} title={title}>
      <input type="checkbox" className="vk-checkbox__input sr-only" {...props} />
      <span className="vk-checkbox__box" aria-hidden="true">
        <svg viewBox="0 0 12 12" fill="none" className="vk-checkbox__icon">
          <path
            d="M10 3L4.5 8.5 2 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
  );
}
