'use client';

import { AnswerStats } from '@vkvize/shared';

export function AnswerStatsBar({ stats }: { stats: AnswerStats | null | undefined }) {
  if (!stats || stats.totalParticipants === 0) return null;

  const percent = Math.round((stats.answeredCount / stats.totalParticipants) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--vk-text-secondary)]">Ответили на вопрос</span>
        <span className="font-semibold text-[var(--vk-text-primary)]">
          {stats.answeredCount} / {stats.totalParticipants}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--vk-bg-hover)]">
        <div
          className="h-full rounded-full bg-[var(--vk-primary)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
