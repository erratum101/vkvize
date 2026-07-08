'use client';

import { LeaderboardEntry } from '@vkvize/shared';
import { Avatar } from './Avatar';

export function Leaderboard({ entries, highlightId }: { entries: LeaderboardEntry[]; highlightId?: string }) {
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-6">
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4 py-4">
          {[1, 0, 2].map((idx) => {
            const entry = top3[idx];
            if (!entry) return <div key={idx} className="w-24" />;
            const heights = ['h-28', 'h-36', 'h-20'];
            const medals = ['🥈', '🥇', '🥉'];
            return (
              <div key={entry.participantId} className="flex flex-col items-center">
                <span className="text-2xl mb-1">{medals[idx]}</span>
                <div
                  className={`w-24 ${heights[idx]} bg-[var(--vk-primary)] rounded-t-[var(--vk-radius-md)] flex flex-col items-center justify-end pb-3 text-white`}
                >
                  <Avatar name={entry.name} avatarUrl={entry.avatarUrl} size="md" className="mb-2 ring-white/80" />
                  <span className="font-bold text-lg">{entry.totalScore}</span>
                </div>
                <p className="text-sm font-medium mt-2 text-center truncate w-24">{entry.name}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--vk-radius-md)] border border-[var(--vk-border-light)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--vk-bg-hover)]">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Участник</th>
              <th className="px-4 py-3 text-right">Баллы</th>
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
                <td className="px-4 py-3 text-[var(--vk-text-secondary)]">{e.rank}</td>
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar name={e.name} avatarUrl={e.avatarUrl} size="sm" />
                    <span>{e.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[var(--vk-primary)]">
                  {e.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && (
          <p className="text-center py-8 text-[var(--vk-text-secondary)]">Нет участников</p>
        )}
      </div>

      {rest.length > 0 && (
        <div className="hidden">{rest.map((e) => e.name).join(',')}</div>
      )}
    </div>
  );
}
