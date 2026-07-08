import { generateRoomCode, DEFAULT_QUIZ_SETTINGS, QuizSettings, SessionPhase, QuestionType } from '@vkvize/shared';
import { prisma } from '../lib/prisma';
import { sessionManager } from './sessionManager';

export async function generateUniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateRoomCode();
    const existing = await prisma.quizSession.findUnique({ where: { roomCode: code } });
    if (!existing && !sessionManager.get(code)) return code;
  }
  throw new Error('Could not generate room code');
}

export async function createQuizSession(quizId: string, organizerId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, organizerId },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!quiz) return null;
  if (quiz.questions.length < 2) return { error: 'not_enough_questions' as const };

  const roomCode = await generateUniqueRoomCode();
  const session = await prisma.quizSession.create({
    data: { quizId: quiz.id, roomCode, status: 'WAITING', phase: 'LOBBY' },
  });

  const settings = (quiz.settings as unknown as QuizSettings) ?? DEFAULT_QUIZ_SETTINGS;
  let questions = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type as QuestionType,
    text: q.text,
    imageUrl: q.imageUrl,
    timeLimitSec: q.timeLimitSec,
    points: q.points,
    order: q.order,
    options: q.options.map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl })),
    correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
  }));

  if (settings.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  sessionManager.create({
    sessionId: session.id,
    roomCode,
    quizId: quiz.id,
    quizTitle: quiz.title,
    organizerId,
    phase: SessionPhase.LOBBY,
    currentQuestionIndex: -1,
    questionDeadline: null,
    questions,
    settings,
  });

  return { session, roomCode };
}
