'use client';

import { ReactNode, useState } from 'react';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { Input } from './Input';
import { LocalProfile, fileToDataUrl } from '@/lib/local-profile';

interface ProfileFormProps {
  title?: string;
  subtitle?: string;
  submitLabel?: string;
  submittingLabel?: string;
  initialProfile?: LocalProfile | null;
  errors?: { name?: string };
  onClearError?: () => void;
  onSubmit: (profile: Omit<LocalProfile, 'id'> & { id?: string }) => void | Promise<void>;
  /** Extra fields rendered inside the same form, after the avatar picker and before the submit button. */
  children?: ReactNode;
}

const avatarPresets = [
  'https://api.dicebear.com/9.x/thumbs/svg?seed=BlueFox&backgroundColor=0088ff',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=PinkCat&backgroundColor=ff4fd8',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=CyberOwl&backgroundColor=21d4fd',
  'https://api.dicebear.com/9.x/thumbs/svg?seed=QuizBear&backgroundColor=7b61ff',
];

export function ProfileForm({
  title = 'Как вас представить?',
  subtitle = 'Введите имя и выберите аватарку. Если не выбрать картинку, покажем первую букву на уникальном цвете.',
  submitLabel = 'Продолжить',
  submittingLabel = 'Сохранение...',
  initialProfile,
  errors,
  onClearError,
  onSubmit,
  children,
}: ProfileFormProps) {
  const [name, setName] = useState(initialProfile?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatarUrl ?? null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setAvatarUrl(await fileToDataUrl(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ id: initialProfile?.id, name, avatarUrl });
    } finally {
      setLoading(false);
    }
  };

  const nameError = errors?.name;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center">
        <div className="mb-3 flex justify-center">
          <Avatar name={name} avatarUrl={avatarUrl} size="xl" />
        </div>
        <h2 className="text-xl font-black text-[var(--vk-text-primary)]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--vk-text-secondary)]">{subtitle}</p>
      </div>

      <Input
        label="Имя"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (errors?.name) onClearError?.();
        }}
        placeholder="Например, Алиса"
        error={nameError}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--vk-text-primary)]">Аватарка</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAvatarUrl(null)}
            className={`shrink-0 rounded-full p-1 transition ${!avatarUrl ? 'bg-[var(--vk-primary)]' : 'bg-white'}`}
          >
            <Avatar name={name} size="lg" />
          </button>
          {avatarPresets.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setAvatarUrl(src)}
              className={`shrink-0 rounded-full p-1 transition ${avatarUrl === src ? 'bg-[var(--vk-primary)]' : 'bg-white'}`}
            >
              <Avatar name={name} avatarUrl={src} size="lg" />
            </button>
          ))}
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-[var(--vk-radius-sm)] bg-[var(--vk-bg-hover)] px-4 py-2 text-sm font-medium text-[var(--vk-primary)] hover:bg-[var(--vk-border-light)]">
          Загрузить свою
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      {children}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}
