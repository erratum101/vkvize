'use client';

import Image from 'next/image';
import { LeaderboardEntry } from '@vkvize/shared';
import { Avatar } from './Avatar';

const PODIUM_STYLES: Record<number, { medal: string; bar: string; glow: string; delay: string }> = {
  1: {
    medal: '🥇',
    bar: 'vk-lb-podium--gold',
    glow: 'vk-lb-podium-glow--gold',
    delay: 'vk-lb-delay-2',
  },
  2: {
    medal: '🥈',
    bar: 'vk-lb-podium--silver',
    glow: 'vk-lb-podium-glow--silver',
    delay: 'vk-lb-delay-1',
  },
  3: {
    medal: '🥉',
    bar: 'vk-lb-podium--bronze',
    glow: 'vk-lb-podium-glow--bronze',
    delay: 'vk-lb-delay-3',
  },
};

const PODIUM_HEIGHTS: Record<number, string> = {
  1: 'h-36 sm:h-40',
  2: 'h-28 sm:h-32',
  3: 'h-20 sm:h-24',
};

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
            return (
              <div
                key={entry.participantId}
                className={`vk-lb-podium-col ${style.delay} ${isWinner ? 'vk-lb-podium-col--winner' : ''}`}
              >
                <span className={`vk-lb-medal ${style.delay}`}>{style.medal}</span>
                <div className={`vk-lb-podium-glow ${style.glow}`} aria-hidden />
                <div
                  className={`vk-lb-podium-bar ${style.bar} ${PODIUM_HEIGHTS[rank]} ${
                    entry.participantId === highlightId ? 'vk-lb-podium-bar--you' : ''
                  }`}
                >
                  {isWinner && <span className="vk-lb-crown" aria-hidden>👑</span>}
                  <Avatar
                    name={entry.name}
                    avatarUrl={entry.avatarUrl}
                    size={isWinner ? 'lg' : 'md'}
                    className="vk-lb-podium-avatar"
                  />
                  <span className="vk-lb-podium-score">{entry.totalScore}</span>
                  <span className="vk-lb-podium-points">баллов</span>
                </div>
                <p className="vk-lb-podium-name">{entry.name}</p>
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
                  style={{ animationDelay: `${120 + index * 70}ms` }}
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
