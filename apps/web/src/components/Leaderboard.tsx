'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LeaderboardEntry } from '@vkvize/shared';
import { Avatar } from './Avatar';

const PODIUM_STYLES: Record<number, { medal: string; bar: string; glow: string }> = {
  1: { medal: '🥇', bar: 'vk-lb-podium--gold', glow: 'vk-lb-podium-glow--gold' },
  2: { medal: '🥈', bar: 'vk-lb-podium--silver', glow: 'vk-lb-podium-glow--silver' },
  3: { medal: '🥉', bar: 'vk-lb-podium--bronze', glow: 'vk-lb-podium-glow--bronze' },
};

const PODIUM_HEIGHTS: Record<number, string> = {
  1: 'h-36 sm:h-40',
  2: 'h-28 sm:h-32',
  3: 'h-20 sm:h-24',
};

// Suspenseful reveal order: 3rd place first, then 2nd, then the winner last.
const REVEAL_ORDER = [3, 2, 1];
const REVEAL_START_MS = 300;
const REVEAL_STEP_MS = 700;

function buildPodiumLayout(top3: LeaderboardEntry[]) {
  if (top3.length === 1) {
    return [{ entry: top3[0], rank: 1 as const }];
  }
  if (top3.length === 2) {
    return [
      { entry: top3[1], rank: 2 as const },
      { entry: top3[0], rank: 1 as const },
    ];
  }
  return [
    { entry: top3[1], rank: 2 as const },
    { entry: top3[0], rank: 1 as const },
    { entry: top3[2], rank: 3 as const },
  ];
}

function useSequentialReveal(ranks: number[]) {
  const key = ranks.join(',');
  const [revealed, setRevealed] = useState<number[]>([]);

  useEffect(() => {
    setRevealed([]);
    if (!ranks.length) return;
    const timers = ranks.map((rank, i) =>
      setTimeout(() => {
        setRevealed((prev) => (prev.includes(rank) ? prev : [...prev, rank]));
      }, REVEAL_START_MS + i * REVEAL_STEP_MS)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return revealed;
}

function AnimatedScore({ value, active, className }: { value: number; active: boolean; className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const duration = 850;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value]);

  return <span className={className}>{active ? display : 0}</span>;
}

export function Leaderboard({
  entries,
  highlightId,
  showHero = true,
}: {
  entries: LeaderboardEntry[];
  highlightId?: string;
  showHero?: boolean;
}) {
  const top3 = entries.filter((entry) => entry.rank <= 3).sort((a, b) => a.rank - b.rank);
  const podiumLayout = buildPodiumLayout(top3);
  const winner = top3.find((e) => e.rank === 1);

  const revealOrder = REVEAL_ORDER.filter((rank) => top3.some((e) => e.rank === rank));
  const revealed = useSequentialReveal(revealOrder);
  const tableRevealDelay = REVEAL_START_MS + revealOrder.length * REVEAL_STEP_MS + 150;

  return (
    <div className={`vk-leaderboard ${showHero ? '' : 'vk-leaderboard--compact'}`}>
      {showHero && (
      <div className="vk-lb-hero">
        <div className="vk-lb-confetti" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={`vk-lb-confetti-piece vk-lb-confetti-piece--${(i % 6) + 1}`} />
          ))}
        </div>
        <div className="vk-lb-hero-art">
          <Image
            src="/design/vk-illustration-leaderboard.png"
            alt=""
            width={280}
            height={200}
            className="vk-lb-hero-image"
            unoptimized
          />
        </div>
        <div className="vk-lb-hero-text">
          <p className="vk-lb-eyebrow">Финиш!</p>
          <h3 className="vk-lb-title">Лидерборд</h3>
          {winner && (
            <p className="vk-lb-winner-line">
              Победитель: <span>{winner.name}</span>
            </p>
          )}
        </div>
      </div>
      )}

      {podiumLayout.length > 0 && (
        <div className="vk-lb-podium-stage">
          {podiumLayout.map(({ entry, rank }) => {
            const style = PODIUM_STYLES[rank];
            const isWinner = rank === 1;
            const isRevealed = revealed.includes(rank);
            return (
              <div
                key={entry.participantId}
                className={`vk-lb-podium-col ${isRevealed ? 'vk-lb-podium-col--revealed' : ''} ${
                  isWinner ? 'vk-lb-podium-col--winner' : ''
                }`}
              >
                {isWinner && isRevealed && (
                  <div className="vk-lb-winner-burst" aria-hidden>
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span key={i} className={`vk-lb-burst-piece vk-lb-burst-piece--${(i % 7) + 1}`} />
                    ))}
                  </div>
                )}
                <span className={`vk-lb-medal ${isRevealed ? 'vk-lb-medal--pop' : ''}`}>{style.medal}</span>
                <div
                  className={`vk-lb-podium-glow ${style.glow} ${isRevealed ? 'vk-lb-podium-glow--active' : ''}`}
                  aria-hidden
                />
                <div
                  className={`vk-lb-podium-bar ${style.bar} ${PODIUM_HEIGHTS[rank]} ${
                    entry.participantId === highlightId ? 'vk-lb-podium-bar--you' : ''
                  } ${isWinner ? 'vk-lb-podium-bar--winner' : ''}`}
                >
                  {isWinner && <span className="vk-lb-crown" aria-hidden>👑</span>}
                  <Avatar
                    name={entry.name}
                    avatarUrl={entry.avatarUrl}
                    size={isWinner ? 'lg' : 'md'}
                    className="vk-lb-podium-avatar"
                  />
                  <AnimatedScore value={entry.totalScore} active={isRevealed} className="vk-lb-podium-score" />
                  <span className="vk-lb-podium-points">баллов</span>
                </div>
                <p className={`vk-lb-podium-name ${isRevealed ? 'vk-lb-podium-name--in' : ''}`}>{entry.name}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="vk-lb-table-wrap">
        <table className="vk-lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Участник</th>
              <th className="text-right">Баллы</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const isYou = entry.participantId === highlightId;
              const isTop = entry.rank <= 3;
              return (
                <tr
                  key={entry.participantId}
                  className={`vk-lb-row vk-lb-row--in ${isYou ? 'vk-lb-row--you' : ''} ${
                    isTop ? `vk-lb-row--top${entry.rank}` : ''
                  }`}
                  style={{ animationDelay: `${tableRevealDelay + index * 70}ms` }}
                >
                  <td>
                    <span className={`vk-lb-rank ${isTop ? `vk-lb-rank--${entry.rank}` : ''}`}>
                      {isTop ? PODIUM_STYLES[entry.rank as 1 | 2 | 3].medal : entry.rank}
                    </span>
                  </td>
                  <td>
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size="sm" />
                      <span className="truncate font-medium">{entry.name}</span>
                      {isYou && <span className="vk-lb-you-badge">вы</span>}
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="vk-lb-score">{entry.totalScore}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="py-10 text-center text-[var(--vk-text-secondary)]">Нет участников</p>
        )}
      </div>
    </div>
  );
}
