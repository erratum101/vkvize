'use client';

import { LeaderboardEntry } from '@vkvize/shared';
import { Avatar } from './Avatar';

const MEDALS = ['🥇', '🥈', '🥉'] as const;
const HEIGHTS = ['h-36', 'h-28', 'h-20'] as const;

export function Leaderboard({ entries, highlightId }: { entries: LeaderboardEntry[]; highlightId?: string }) {
  const top3 = entries.filter((entry) => entry.rank <= 3).sort((a, b) => a.rank - b.rank);

  const podiumLayout =
    top3.length === 1
      ? [{ entry: top3[0], height: 'h-32', medal: MEDALS[0] }]
      : top3.length === 2
        ? [
            { entry: top3[1], height: HEIGHTS[1], medal: MEDALS[1] },
            { entry: top3[0], height: HEIGHTS[0], medal: MEDALS[0] },
          ]
        : [
            { entry: top3[1], height: HEIGHTS[1], medal: MEDALS[1] },
            { entry: top3[0], height: HEIGHTS[0], medal: MEDALS[0] },
            { entry: top3[2], height: HEIGHTS[2], medal: MEDALS[2] },
          ];

  return (
    <div className="space-y-6">
      {podiumLayout.length > 0 && (
        <div className="flex items-end justify-center gap-3 py-2 sm:gap-4 sm:py-4">
          {podiumLayout.map(({ entry, height, medal }) => (
            <div key={entry.participantId} className="flex w-20 flex-col items-center sm:w-24">
              <span className="mb-1 text-2xl">{medal}</span>
              <div
                className={`w-full ${height} flex flex-col items-center justify-end rounded-t-[var(--vk-radius-md)] bg-[var(--vk-primary)] pb-3 text-white`}
              >
                <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size="md" className="mb-2 ring-white/80" />
                <span className="text-lg font-bold">{entry.totalScore}</span>
              </div>
              <p className="mt-2 w-full truncate text-center text-sm font-medium">{entry.name}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto overflow-hidden rounded-[var(--vk-radius-md)] border border-[var(--vk-border-light)]">
        <table className="w-full min-w-[280px] text-sm">
          <thead className="bg-[var(--vk-bg-hover)]">
            <tr>
              <th className="px-3 py-3 text-left sm:px-4">#</th>
              <th className="px-3 py-3 text-left sm:px-4">Участник</th>
              <th className="px-3 py-3 text-right sm:px-4">Баллы</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.participantId}
                className={`border-t border-[var(--vk-border-light)] ${
                  e.participantId === highlightId ? 'bg-[var(--vk-primary)]/10' : ''
                }`}
              >
                <td className="px-3 py-3 text-[var(--vk-text-secondary)] sm:px-4">{e.rank}</td>
                <td className="px-3 py-3 font-medium sm:px-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar name={e.name} avatarUrl={e.avatarUrl} size="sm" />
                    <span className="truncate">{e.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-semibold text-[var(--vk-primary)] sm:px-4">
                  {e.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="py-8 text-center text-[var(--vk-text-secondary)]">Нет участников</p>
        )}
      </div>
    </div>
  );
}
