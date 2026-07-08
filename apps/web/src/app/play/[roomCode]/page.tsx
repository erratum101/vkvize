'use client';

import { Suspense, useEffect } from 'react';
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
import { HourglassWaiting } from '@/components/HourglassWaiting';
import { mapJoinError } from '@/lib/join-session';

function PlayContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = (params.roomCode as string).toUpperCase();
  const { user, setProfile } = useAuth();
  const { connected, sessionState, leaderboard, participantId, error, timeLeft, resultTimeLeft, phase, submitAnswer } =
    useQuizSession(roomCode, 'participant', user);

  useEffect(() => {
    if (!error || !user) return;
    router.replace(`/join?code=${roomCode}&error=${encodeURIComponent(mapJoinError(error))}`);
  }, [error, user, roomCode, router]);

  if (!user) {
    return (
      <div className="vk-page mx-auto max-w-md px-4 py-8">
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
      <div className="vk-page mx-auto max-w-lg px-4 py-8 text-center text-[var(--vk-text-secondary)]">
        Перенаправление...
      </div>
    );
  }

  return (
    <div className="vk-page mx-auto max-w-2xl space-y-4 px-4 py-4 sm:space-y-6 sm:py-6">
      <div className="text-center">
        <h1 className="text-lg font-bold sm:text-xl">{sessionState?.quizTitle ?? 'Квиз'}</h1>
        <p className="text-xs text-[var(--vk-text-secondary)] sm:text-sm">
          {connected ? 'Подключено' : 'Подключение...'} · {roomCode}
        </p>
      </div>

      {phase === SessionPhase.LOBBY && (
        <Card>
          <CardBody>
            <HourglassWaiting />
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
              timeLeft={timeLeft}
              onSubmit={async (ids) => {
                await submitAnswer(sessionState.currentQuestion!.id, ids);
              }}
            />
            {phase === SessionPhase.QUESTION_RESULT && resultTimeLeft !== null && resultTimeLeft > 0 && (
              <p className="mt-4 text-center text-sm text-[var(--vk-text-secondary)]">
                Следующий вопрос через {resultTimeLeft}с
              </p>
            )}
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
