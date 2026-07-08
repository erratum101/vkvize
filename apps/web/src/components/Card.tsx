import { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[var(--vk-bg-card)] rounded-[var(--vk-radius-md)] shadow-[var(--vk-shadow-sm)] border border-[var(--vk-border-light)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex min-h-[5rem] items-center border-b border-[var(--vk-border-light)] px-6 py-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--vk-text-primary)]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[var(--vk-text-secondary)]">{subtitle}</p>}
      </div>
    </div>
  );
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
