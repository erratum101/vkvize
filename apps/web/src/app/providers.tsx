'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable="true"]';

function isEditableTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(EDITABLE_SELECTOR));
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const preventLinkDrag = (event: DragEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('a')) {
        event.preventDefault();
      }
    };

    const preventSelection = (event: Event) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    };

    const preventClipboard = (event: ClipboardEvent) => {
      if (!isEditableTarget(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener('dragstart', preventLinkDrag);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('copy', preventClipboard);
    document.addEventListener('cut', preventClipboard);

    return () => {
      document.removeEventListener('dragstart', preventLinkDrag);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('copy', preventClipboard);
      document.removeEventListener('cut', preventClipboard);
    };
  }, []);

  return (
    <AuthProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </AuthProvider>
  );
}
