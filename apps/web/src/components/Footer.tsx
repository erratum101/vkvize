import Link from 'next/link';

const FIGMA_URL = process.env.NEXT_PUBLIC_FIGMA_URL || 'https://www.figma.com/design/87S1sP6C7WkkNEHOze24bQ/Vkvize?node-id=3-55';
const MIRO_URL = process.env.NEXT_PUBLIC_MIRO_URL || 'https://miro.com/app/board/PLACEHOLDER';
const GITHUB_URL = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/PLACEHOLDER/vkvize';
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || '';

export function Footer() {
  return (
    <footer className="mt-auto w-full md:px-4">
      <div className="vk-footer-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-left md:px-4 md:py-8">
          <div className="hidden gap-6 text-sm md:grid md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold text-[var(--vk-text-primary)]">V Kvize</h3>
              <p className="text-[var(--vk-text-secondary)]">
                Платформа для проведения квизов в реальном времени
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-[var(--vk-text-primary)]">Макеты</h3>
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
              <h3 className="mb-2 font-semibold text-[var(--vk-text-primary)]">Проект</h3>
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

          <div className="space-y-2 text-sm md:hidden">
            <div>
              <h3 className="font-semibold text-[var(--vk-text-primary)]">V Kvize</h3>
              <p className="text-xs text-[var(--vk-text-secondary)]">
                Платформа для проведения квизов в реальном времени
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-semibold text-[var(--vk-text-primary)]">Макеты:</span>
              <a href={FIGMA_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                Figma
              </a>
              <a href={MIRO_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                Miro
              </a>
              <span className="text-[var(--vk-border)]">|</span>
              <span className="font-semibold text-[var(--vk-text-primary)]">Проект:</span>
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--vk-primary)] hover:underline">
                GitHub
              </a>
              <Link href="/about" className="text-[var(--vk-primary)] hover:underline">
                О проекте
              </Link>
            </div>
          </div>

          <p className="mt-3 text-left text-xs text-[var(--vk-text-secondary)] md:mt-6 md:text-center">
            © 2026 V Kvize
          </p>
        </div>
      </div>
    </footer>
  );
}
