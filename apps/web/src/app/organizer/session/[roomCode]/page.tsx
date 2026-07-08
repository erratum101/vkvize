'use client';

import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/auth-context';
import { useQuizSession } from '@/hooks/useQuizSession';
import { SessionPhase } from '@vkvize/shared';
import { Button } from '@/components/Button';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { Leaderboard } from '@/components/Leaderboard';
import { ProfileForm } from '@/components/ProfileForm';
import { Avatar } from '@/components/Avatar';
import { Loader } from '@/components/Loader';
import { AnswerStatsBar } from '@/components/AnswerStatsBar';
import Link from 'next/link';

const PHASE_LABELS: Record<string, string> = {
  LOBBY: 'Лобби',
  ANSWERING: 'Приём ответов',
  QUESTION_RESULT: 'Показ результата',
  FINISHED: 'Завершён',
};

export default function OrganizerSessionPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const { user, loading, setProfile } = useAuth();
  const { connected, sessionState, leaderboard, error, timeLeft, resultTimeLeft, showQuestion, finishSession } =
    useQuizSession(roomCode, 'organizer', user);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>;

  if (!user) {
    return (
      <div className="vk-page mx-auto max-w-md px-4 py-8">
        <Card>
          <CardBody>
            <ProfileForm
              title="Профиль ведущего"
              subtitle="Введите имя и аватарку, чтобы управлять комнатой квиза."
              submitLabel="Подключиться как ведущий"
              onSubmit={(profile) => {
                setProfile(profile);
              }}
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  const phase = sessionState?.phase;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join?code=${roomCode}` : '';

  return (
    <div className="vk-page mx-auto max-w-4xl space-y-4 px-4 py-4 sm:space-y-6 sm:py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{sessionState?.quizTitle ?? 'Квиз'}</h1>
          <p className="text-sm text-[var(--vk-text-secondary)]">
            {connected ? '🟢 Подключено' : '🔴 Подключение...'}
          </p>
        </div>
        {phase === SessionPhase.FINISHED && (
          <Button href={`/play/${roomCode}/results`} className="w-full sm:w-auto">
            Результаты
          </Button>
        )}
      </div>

      {error && <p className="text-[var(--vk-danger)]">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Card>
          <CardHeader title="Код комнаты" subtitle="Участники подключаются по этому коду" />
          <CardBody className="space-y-4 text-center">
            <div className="text-4xl font-bold tracking-widest text-[var(--vk-primary)] sm:text-5xl">{roomCode}</div>
            {joinUrl && (
              <div className="flex justify-center">
                <QRCodeSVG value={joinUrl} size={140} className="sm:hidden" />
                <QRCodeSVG value={joinUrl} size={160} className="hidden sm:block" />
              </div>
            )}
            <p className="break-all text-xs text-[var(--vk-text-secondary)] sm:text-sm">{joinUrl}</p>
            <Link href={`/join?code=${roomCode}`} className="text-sm text-[var(--vk-primary)] hover:underline">
              Открыть страницу входа
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Управление" subtitle={`Фаза: ${phase ? PHASE_LABELS[phase] ?? phase : '—'}`} />
          <CardBody className="space-y-4">
            {phase === SessionPhase.LOBBY && (
              <Button className="w-full" onClick={() => showQuestion().catch(alert)}>
                Начать квиз
              </Button>
            )}

            {phase === SessionPhase.ANSWERING && timeLeft !== null && (
              <div className="rounded-[var(--vk-radius-md)] bg-[var(--vk-bg-hover)] px-4 py-3 text-center">
                <p className="text-xs text-[var(--vk-text-secondary)]">До конца вопроса</p>
                <p className="text-2xl tabular-nums text-[var(--vk-text-primary)]">{timeLeft}с</p>
              </div>
            )}

            {phase === SessionPhase.QUESTION_RESULT && resultTimeLeft !== null && (
              <div className="rounded-[var(--vk-radius-md)] bg-[var(--vk-bg-hover)] px-4 py-3 text-center">
                <p className="text-xs text-[var(--vk-text-secondary)]">До следующего вопроса</p>
                <p className="text-2xl tabular-nums text-[var(--vk-text-primary)]">{resultTimeLeft}с</p>
              </div>
            )}

            {phase !== SessionPhase.LOBBY && phase !== SessionPhase.FINISHED && (
              <AnswerStatsBar stats={sessionState?.answerStats} />
            )}

            {phase !== SessionPhase.FINISHED && phase !== SessionPhase.LOBBY && (
              <p className="text-sm text-[var(--vk-text-secondary)]">
                Вопросы переключаются автоматически по таймеру
              </p>
            )}

            {phase !== SessionPhase.FINISHED && (
              <Button className="w-full" variant="ghost" onClick={() => finishSession().catch(alert)}>
                Завершить досрочно
              </Button>
            )}

            <p className="text-sm text-[var(--vk-text-secondary)]">
              Вопрос {Math.max(0, (sessionState?.currentQuestionIndex ?? -1) + 1)} / {sessionState?.totalQuestions ?? 0}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={`Участники (${sessionState?.participants.length ?? 0})`} />
        <CardBody>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {sessionState?.participants.map((p) => (
              <li
                key={p.id}
                className="flex min-w-0 items-center gap-2 rounded-[var(--vk-radius-sm)] bg-[var(--vk-bg-hover)] px-3 py-2 text-sm"
              >
                <Avatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto shrink-0 text-[var(--vk-text-secondary)]">{p.totalScore} б.</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {leaderboard.length > 0 && (
        <Card>
          <CardHeader title="Лидерборд" />
          <CardBody>
            <Leaderboard entries={leaderboard} showHero={phase === SessionPhase.FINISHED} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
