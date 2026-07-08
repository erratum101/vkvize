import Link from 'next/link';
import { ReactNode } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  children: ReactNode;
}

const variants = {
  primary: 'bg-[var(--vk-primary)] text-white hover:bg-[var(--vk-primary-hover)]',
  secondary: 'bg-[var(--vk-bg-hover)] text-[var(--vk-text-primary)] hover:bg-[var(--vk-border-light)]',
  ghost: 'bg-transparent text-[var(--vk-primary)] hover:bg-[var(--vk-bg-hover)]',
  danger: 'bg-[var(--vk-danger)] text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', href, children, className = '', ...props }: ButtonProps) {
  const cls = `inline-flex select-none items-center justify-center font-medium rounded-[var(--vk-radius-sm)] transition-[var(--vk-transition)] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} draggable={false}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
