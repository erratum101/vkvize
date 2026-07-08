import Link from 'next/link';

const FIGMA_URL = process.env.NEXT_PUBLIC_FIGMA_URL || 'https://www.figma.com/design/87S1sP6C7WkkNEHOze24bQ/Vkvize?node-id=3-55';
const MIRO_URL = process.env.NEXT_PUBLIC_MIRO_URL || 'https://miro.com/app/board/PLACEHOLDER';
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/PLACEHOLDER/vkvize';
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || '';

export function Footer() {
  return (
    <footer className="mt-auto flex w-full justify-center px-4">
      <div className="vk-footer-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-6 text-center text-sm md:grid-cols-3 md:text-left">
          <div>
            <h3 className="font-semibold text-[var(--vk-text-primary)] mb-2">V Kvize</h3>
            <p className="text-[var(--vk-text-secondary)]">
              Платформа для проведения квизов в реальном времени
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--vk-text-primary)] mb-2">Макеты</h3>
            <ul className="space-y-1">
              <li>
                <a href={FIGMA_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                  Figma
                </a>
              </li>
              <li>
                <a href={MIRO_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                  Miro
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--vk-text-primary)] mb-2">Проект</h3>
            <ul className="space-y-1">
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                  GitHub
                </a>
              </li>
              {DEMO_URL && (
                <li>
                  <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                    Demo
                  </a>
                </li>
              )}
              <li>
                <Link href="/about" className="text-[var(--vk-primary)] hover:underline">
                  О проекте
                </Link>
              </li>
            </ul>
          </div>
          </div>
          <p className="mt-6 text-center text-xs text-[var(--vk-text-secondary)]">
            © 2026 V Kvize
          </p>
        </div>
      </div>
    </footer>
  );
}
