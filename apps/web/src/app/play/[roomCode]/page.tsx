'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useQuizSession } from '@/hooks/useQuizSession';
import { SessionPhase } from '@vkvize/shared';
import { Card, CardBody, CardHeader } from '@/components/Card';
import { QuestionView } from '@/components/QuestionView';
import { Leaderboard } from '@/components/Leaderboard';
import { Button } from '@/components/Button';
import { ProfileForm } from '@/components/ProfileForm';
import { Loader } from '@/components/Loader';
import { mapJoinError } from '@/lib/join-session';

function PlayContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toUpperCase();
  const { user, setProfile } = useAuth();
  const { connected, sessionState, leaderboard, participantId, error, timeLeft, phase, submitAnswer } =
    useQuizSession(roomCode, 'participant', user);
  const [displayTime, setDisplayTime] = useState<number | null>(null);

  useEffect(() => {
    if (sessionState?.questionDeadline) {
      const tick = () => {
        setDisplayTime(Math.max(0, Math.ceil((sessionState.questionDeadline! - Date.now()) / 1000)));
      };
      tick();
      const id = setInterval(tick, 500);
      return () => clearInterval(id);
    }
    setDisplayTime(null);
  }, [sessionState?.questionDeadline, sessionState?.currentQuestion?.id]);

  useEffect(() => {
    if (!error || !user) return;
    router.replace(
      `/join?code=${roomCode}&error=${encodeURIComponent(mapJoinError(error))}`
    );
  }, [error, user, roomCode, router]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 pt-15">
        <Card>
          <CardBody>
            <ProfileForm
              title="Профиль участника"
              subtitle="Введите имя и выберите аватарку перед подключением к квизу."
              submitLabel="Подключиться"
              onSubmit={(profile) => {
                setProfile(profile);
              }}
            />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 pt-32 text-center text-[var(--vk-text-secondary)]">
        Перенаправление...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">{sessionState?.quizTitle ?? 'Квиз'}</h1>
        <p className="text-sm text-[var(--vk-text-secondary)]">
          {connected ? 'Подключено' : 'Подключение...'} · {roomCode}
        </p>
      </div>

      {phase === SessionPhase.LOBBY && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-lg font-medium">Ожидание начала квиза</p>
            <p className="text-[var(--vk-text-secondary)] mt-2">Организатор скоро запустит первый вопрос</p>
          </CardBody>
        </Card>
      )}

      {sessionState?.currentQuestion && phase !== SessionPhase.LOBBY && phase !== SessionPhase.FINISHED && (
        <Card>
          <CardHeader
            title={`Вопрос ${sessionState.currentQuestionIndex + 1} / ${sessionState.totalQuestions}`}
          />
          <CardBody>
            <QuestionView
              question={sessionState.currentQuestion}
              phase={phase}
              timeLeft={displayTime}
              onSubmit={async (ids) => {
                await submitAnswer(sessionState.currentQuestion!.id, ids);
              }}
            />
          </CardBody>
        </Card>
      )}

      {phase === SessionPhase.FINISHED && (
        <Card>
          <CardHeader title="Квиз завершён!" />
          <CardBody className="space-y-4">
            <Leaderboard entries={leaderboard} highlightId={participantId ?? undefined} />
            <Button href={`/play/${roomCode}/results`} className="w-full">
              Полные результаты
            </Button>
          </CardBody>
        </Card>
      )}

      {leaderboard.length > 0 && phase !== SessionPhase.FINISHED && phase !== SessionPhase.LOBBY && (
        <Card>
          <CardHeader title="Текущий рейтинг" />
          <CardBody>
            <Leaderboard entries={leaderboard.slice(0, 5)} highlightId={participantId ?? undefined} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader label="Загрузка..." /></div>}>
      <PlayContent />
    </Suspense>
  );
}
