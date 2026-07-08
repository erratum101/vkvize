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
import Link from 'next/link';

export default function OrganizerSessionPage() {
  const params = useParams();
  const roomCode = (params.roomCode as string).toUpperCase();
  const { user, loading, setProfile } = useAuth();
  const { connected, sessionState, leaderboard, error, showQuestion, closeQuestion, finishSession } =
    useQuizSession(roomCode, 'organizer', user);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 pt-15">
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{sessionState?.quizTitle ?? 'Квиз'}</h1>
          <p className="text-[var(--vk-text-secondary)]">
            {connected ? '🟢 Подключено' : '🔴 Подключение...'}
          </p>
        </div>
        {phase === SessionPhase.FINISHED && (
          <Button href={`/play/${roomCode}/results`}>Результаты</Button>
        )}
      </div>

      {error && <p className="text-[var(--vk-danger)]">{error}</p>}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Код комнаты" subtitle="Участники подключаются по этому коду" />
          <CardBody className="text-center space-y-4">
            <div className="text-5xl font-bold tracking-widest text-[var(--vk-primary)]">{roomCode}</div>
            {joinUrl && (
              <div className="flex justify-center">
                <QRCodeSVG value={joinUrl} size={160} />
              </div>
            )}
            <p className="text-sm text-[var(--vk-text-secondary)] break-all">{joinUrl}</p>
            <Link href={`/join?code=${roomCode}`} className="text-[var(--vk-primary)] text-sm hover:underline">
              Открыть страницу входа
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Управление" subtitle={`Фаза: ${phase ?? '—'}`} />
          <CardBody className="space-y-3">
            {phase === SessionPhase.LOBBY && (
              <Button className="w-full" onClick={() => showQuestion().catch(alert)}>
                Начать первый вопрос
              </Button>
            )}
            {phase === SessionPhase.ANSWERING && (
              <Button className="w-full" variant="secondary" onClick={() => closeQuestion().catch(alert)}>
                Закрыть приём ответов
              </Button>
            )}
            {(phase === SessionPhase.QUESTION_RESULT) &&
              sessionState &&
              sessionState.currentQuestionIndex < sessionState.totalQuestions - 1 && (
                <Button className="w-full" onClick={() => showQuestion().catch(alert)}>
                  Следующий вопрос
                </Button>
              )}
            {phase === SessionPhase.QUESTION_RESULT &&
              sessionState &&
              sessionState.currentQuestionIndex >= sessionState.totalQuestions - 1 && (
                <Button className="w-full" variant="danger" onClick={() => finishSession().catch(alert)}>
                  Завершить квиз
                </Button>
              )}
            {phase !== SessionPhase.FINISHED && phase !== SessionPhase.LOBBY && (
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
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {sessionState?.participants.map((p) => (
              <li key={p.id} className="flex items-center gap-2 px-3 py-2 bg-[var(--vk-bg-hover)] rounded-[var(--vk-radius-sm)] text-sm">
                <Avatar name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                <span>{p.name} — {p.totalScore} б.</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {leaderboard.length > 0 && (
        <Card>
          <CardHeader title="Лидерборд" />
          <CardBody>
            <Leaderboard entries={leaderboard} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
