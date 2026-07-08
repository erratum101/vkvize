'use client';

import { useEffect, useState } from 'react';
import { LeaderboardEntry } from '@vkvize/shared';
import { Avatar } from './Avatar';

const PODIUM_STYLES: Record<number, { medal: string; bar: string; ring: string }> = {
  1: { medal: '🥇', bar: 'vk-lb-bar--gold', ring: 'vk-lb-ring--gold' },
  2: { medal: '🥈', bar: 'vk-lb-bar--silver', ring: 'vk-lb-ring--silver' },
  3: { medal: '🥉', bar: 'vk-lb-bar--bronze', ring: 'vk-lb-ring--bronze' },
};

const PODIUM_HEIGHTS: Record<number, string> = {
  1: 'h-24 sm:h-28',
  2: 'h-16 sm:h-20',
  3: 'h-11 sm:h-14',
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
  const winnerRevealed = revealed.includes(1);
  const listRevealDelay = REVEAL_START_MS + revealOrder.length * REVEAL_STEP_MS + 150;

  return (
    <div className={`vk-leaderboard ${showHero ? '' : 'vk-leaderboard--compact'}`}>
      {podiumLayout.length > 0 && (
        <div className="vk-lb-stage">
          <div className="vk-lb-aurora" aria-hidden>
            <span className="vk-lb-aurora-blob vk-lb-aurora-blob--1" />
            <span className="vk-lb-aurora-blob vk-lb-aurora-blob--2" />
            <span className="vk-lb-aurora-blob vk-lb-aurora-blob--3" />
          </div>

          {showHero && winner && (
            <div className={`vk-lb-winner-banner ${winnerRevealed ? 'vk-lb-winner-banner--in' : ''}`}>
              <span className="vk-lb-winner-banner-icon" aria-hidden>
                🏆
              </span>
              <span className="vk-lb-winner-banner-text">
                Победитель — <strong>{winner.name}</strong>
              </span>
              <span className="vk-lb-winner-banner-score">{winner.totalScore} баллов</span>
            </div>
          )}

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
                  {isWinner && (
                    <span className={`vk-lb-crown ${isRevealed ? 'vk-lb-crown--pop' : ''}`} aria-hidden>
                      👑
                    </span>
                  )}

                  <div className="vk-lb-avatar-block">
                    {isWinner && isRevealed && (
                      <div className="vk-lb-winner-burst" aria-hidden>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <span key={i} className={`vk-lb-burst-piece vk-lb-burst-piece--${(i % 7) + 1}`} />
                        ))}
                      </div>
                    )}
                    <div className={`vk-lb-avatar-glow ${isRevealed ? 'vk-lb-avatar-glow--active' : ''} ${style.ring}`} aria-hidden />
                    <div className={`vk-lb-avatar-ring ${style.ring}`}>
                      <Avatar
                        name={entry.name}
                        avatarUrl={entry.avatarUrl}
                        size={isWinner ? 'lg' : 'md'}
                        className="vk-lb-podium-avatar"
                      />
                    </div>
                    <span className={`vk-lb-rank-badge ${style.ring} ${isRevealed ? 'vk-lb-rank-badge--pop' : ''}`}>
                      {style.medal}
                    </span>
                  </div>

                  <p className="vk-lb-podium-name">{entry.name}</p>
                  <div className="vk-lb-podium-score-chip">
                    <AnimatedScore value={entry.totalScore} active={isRevealed} className="vk-lb-podium-score" />
                    <span className="vk-lb-podium-points">баллов</span>
                  </div>

                  <div
                    className={`vk-lb-bar ${style.bar} ${PODIUM_HEIGHTS[rank]} ${
                      entry.participantId === highlightId ? 'vk-lb-bar--you' : ''
                    }`}
                  >
                    <span className="vk-lb-bar-number">{rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ol className="vk-lb-list">
        {entries.map((entry, index) => {
          const isYou = entry.participantId === highlightId;
          const isTop = entry.rank <= 3;
          return (
            <li
              key={entry.participantId}
              className={`vk-lb-list-row ${isYou ? 'vk-lb-list-row--you' : ''} ${
                isTop ? `vk-lb-list-row--top${entry.rank}` : ''
              }`}
              style={{ animationDelay: `${listRevealDelay + index * 60}ms` }}
            >
              <span className={`vk-lb-list-rank ${isTop ? `vk-lb-list-rank--${entry.rank}` : ''}`}>
                {isTop ? PODIUM_STYLES[entry.rank as 1 | 2 | 3].medal : entry.rank}
              </span>
              <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size="sm" />
              <span className="vk-lb-list-name">{entry.name}</span>
              {isYou && <span className="vk-lb-you-badge">вы</span>}
              <span className="vk-lb-list-score">{entry.totalScore}</span>
            </li>
          );
        })}
      </ol>
      {entries.length === 0 && (
        <p className="py-10 text-center text-[var(--vk-text-secondary)]">Нет участников</p>
      )}
    </div>
  );
}
