'use client';

import { useId, useState } from 'react';

interface FileInputProps {
  label?: string;
  accept?: string;
  onFile: (file: File) => void;
  buttonLabel?: string;
  compact?: boolean;
}

export function FileInput({
  label,
  accept = 'image/*',
  onFile,
  buttonLabel = 'Выбрать файл',
  compact = false,
}: FileInputProps) {
  const id = useId();
  const [filename, setFilename] = useState('');

  return (
    <div className={compact ? '' : 'space-y-1'}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--vk-text-primary)]">
          {label}
        </label>
      )}
      <div className="flex min-w-0 items-center gap-3">
        <label
          htmlFor={id}
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[var(--vk-radius-sm)] border border-[var(--vk-border)] bg-white font-medium text-[var(--vk-primary)] transition-[var(--vk-transition)] hover:border-[var(--vk-primary)] hover:bg-[var(--vk-primary)]/5 ${
            compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          {buttonLabel}
        </label>
        <span className="truncate text-sm text-[var(--vk-text-secondary)]">
          {filename || 'Файл не выбран'}
        </span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFilename(file.name);
            onFile(file);
          }}
        />
      </div>
    </div>
  );
}
