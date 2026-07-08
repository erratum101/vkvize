'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, LeaderboardEntry } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Leaderboard } from '@/components/Leaderboard';
import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';

export default function ResultsPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const [data, setData] = useState<{ quizTitle: string; leaderboard: LeaderboardEntry[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.sessions
      .results(roomCode)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [roomCode]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-[var(--vk-danger)]">{error}</p>
        <Button href="/" className="mt-4">
          На главную
        </Button>
      </div>
    );
  }

  if (!data) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка результатов..." /></div>;

  return (
    <div className="vk-page mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <Card>
        <CardHeader title={`Итоги квиза — ${data.quizTitle}`} />
        <CardBody>
          <Leaderboard entries={data.leaderboard} />
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="secondary" href="/join">
              Новый квиз
            </Button>
            <Button href="/">На главную</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
