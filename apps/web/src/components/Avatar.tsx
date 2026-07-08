import { getAvatarColor, getInitial } from '@/lib/local-profile';

interface AvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-xl',
  xl: 'h-20 w-20 text-3xl',
};

export function Avatar({ name, avatarUrl, size = 'md', className = '' }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Аватар'}
        className={`${sizes[size]} rounded-full object-cover ring-2 ring-white/70 shadow-[var(--vk-shadow-sm)] ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full font-black text-white shadow-[var(--vk-shadow-sm)] ${className}`}
      style={{ background: getAvatarColor(name) }}
      aria-label={name || 'Аватар'}
    >
      {getInitial(name)}
    </div>
  );
}
