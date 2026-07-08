'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from './Button';
import { Avatar } from './Avatar';

function getScrollTop() {
  return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
}

function UserMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => setOpen(false);

  const handleLogout = () => {
    logout();
    close();
    router.push('/');
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  return (
    <div
      ref={rootRef}
      className="group relative shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-[var(--vk-transition)] group-hover:pr-3"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="sm" className="shrink-0" />
        <span className="hidden max-w-24 truncate text-sm font-medium text-[var(--vk-text-primary)] sm:block sm:max-w-40">
          {user.name}
        </span>
      </button>

      <div
        className={`absolute right-0 top-full z-50 pt-2 transition-[var(--vk-transition)] ${
          open ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0'
        }`}
        role="menu"
      >
        <div className="w-max overflow-hidden rounded-[var(--vk-radius-sm)] border border-[var(--vk-border-light)] bg-white py-1 shadow-[var(--vk-shadow-md)]">
          <Link
            href="/organizer/quizzes"
            role="menuitem"
            draggable={false}
            className="block whitespace-nowrap px-4 py-2.5 text-sm text-[var(--vk-text-primary)] transition-[var(--vk-transition)] hover:bg-[var(--vk-bg-hover)] hover:text-[var(--vk-primary)]"
            onClick={close}
          >
            Мои квизы
          </Link>
          <Link
            href="/join"
            role="menuitem"
            draggable={false}
            className="block whitespace-nowrap px-4 py-2.5 text-sm text-[var(--vk-text-primary)] transition-[var(--vk-transition)] hover:bg-[var(--vk-bg-hover)] hover:text-[var(--vk-primary)]"
            onClick={close}
          >
            Войти в квиз
          </Link>
          <Link
            href="/organizer/quizzes"
            role="menuitem"
            draggable={false}
            className="block whitespace-nowrap px-4 py-2.5 text-sm text-[var(--vk-text-primary)] transition-[var(--vk-transition)] hover:bg-[var(--vk-bg-hover)] hover:text-[var(--vk-primary)]"
            onClick={close}
          >
            Создать квиз
          </Link>
          <div className="my-1 border-t border-[var(--vk-border-light)]" />
          <button
            type="button"
            role="menuitem"
            className="block w-full whitespace-nowrap px-4 py-2.5 text-left text-sm text-[var(--vk-danger)] transition-[var(--vk-transition)] hover:bg-red-50"
            onClick={handleLogout}
          >
            Выйти из сессии
          </button>
        </div>
      </div>
    </div>
  );
}

export function Header({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      setScrolled(getScrollTop() > 0);
    };

    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    document.addEventListener('scroll', updateScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScroll);
      document.removeEventListener('scroll', updateScroll);
    };
  }, []);

  return (
    <header className="vk-header">
      <div className={`vk-header-surface ${scrolled ? 'is-scrolled' : ''}`}>
        <div className={`relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4 ${compact ? 'max-w-4xl' : ''}`}>
          <Link
            href="/"
            draggable={false}
            className="flex min-w-0 shrink items-center gap-2 text-lg font-black tracking-tight text-[var(--vk-text-primary)] sm:text-xl"
          >
            <Image
              src="/design/vkvize-app-icon.png?v=2"
              alt="V Kvize"
              width={34}
              height={34}
              unoptimized
              className="h-8 w-8 shrink-0 rounded-xl"
              priority
            />
            <span className="truncate">V Kvize</span>
          </Link>
          <nav className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  href="/organizer/quizzes"
                  className="shrink-0 !bg-transparent px-2 text-xs hover:!bg-transparent sm:px-3 sm:text-sm text-[var(--vk-text-primary)]/80 hover:text-[var(--vk-text-primary)]"
                >
                  <span className="hidden sm:inline">Создать квиз</span>
                  <span className="sm:hidden">Создать</span>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  href="/join"
                  className="shrink-0 !bg-transparent px-2 text-xs hover:!bg-transparent sm:px-3 sm:text-sm text-[var(--vk-text-primary)]/80 hover:text-[var(--vk-text-primary)]"
                >
                  Войти
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
