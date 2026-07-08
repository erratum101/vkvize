import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { buildLeaderboard } from '../services/scoring';
import {
  ResultParticipantAnswer,
  ResultParticipantDetail,
  ResultQuestionSummary,
  SessionResultsDetail,
} from '@vkvize/shared';

const router = Router();
const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

function buildResultsDetail(session: {
  roomCode: string;
  participants: {
    id: string;
    guestNickname: string | null;
    avatarUrl: string | null;
    totalScore: number;
    user: { name: string; avatarUrl: string | null } | null;
    answers: {
      questionId: string;
      isCorrect: boolean;
      pointsEarned: number;
      selectedOptionIds: unknown;
    }[];
  }[];
  quiz: {
    title: string;
    questions: {
      id: string;
      order: number;
      text: string;
      points: number;
    }[];
  };
}): SessionResultsDetail {
  const leaderboard = buildLeaderboard(
    session.participants.map((p) => ({
      id: p.id,
      name: p.user?.name ?? p.guestNickname ?? 'Участник',
      avatarUrl: p.avatarUrl ?? p.user?.avatarUrl,
      totalScore: p.totalScore,
    }))
  );

  const rankByParticipantId = new Map(leaderboard.map((entry) => [entry.participantId, entry.rank]));

  const questions: ResultQuestionSummary[] = session.quiz.questions.map((question, index) => ({
    id: question.id,
    order: index + 1,
    text: question.text,
    points: question.points,
  }));

  const participants: ResultParticipantDetail[] = session.participants
    .map((participant) => {
      const name = participant.user?.name ?? participant.guestNickname ?? 'Участник';
      const answersByQuestionId = new Map(
        participant.answers.map((answer) => [answer.questionId, answer])
      );

      const answers: ResultParticipantAnswer[] = questions.map((question) => {
        const answer = answersByQuestionId.get(question.id);
        if (!answer) {
          return {
            questionId: question.id,
            isCorrect: false,
            pointsEarned: 0,
            answered: false,
            selectedOptionIds: [],
          };
        }

        const selectedOptionIds = Array.isArray(answer.selectedOptionIds)
          ? answer.selectedOptionIds.filter((id): id is string => typeof id === 'string')
          : [];

        return {
          questionId: question.id,
          isCorrect: answer.isCorrect,
          pointsEarned: answer.pointsEarned,
          answered: true,
          selectedOptionIds,
        };
      });

      return {
        participantId: participant.id,
        name,
        avatarUrl: participant.avatarUrl ?? participant.user?.avatarUrl,
        totalScore: participant.totalScore,
        rank: rankByParticipantId.get(participant.id) ?? session.participants.length,
        answers,
      };
    })
    .sort((a, b) => a.rank - b.rank || b.totalScore - a.totalScore || a.name.localeCompare(b.name, 'ru'));

  return {
    quizTitle: session.quiz.title,
    roomCode: session.roomCode,
    leaderboard,
    questions,
    participants,
  };
}

router.get('/:roomCode', optionalAuth, async (req, res) => {
  const roomCode = param(req.params.roomCode).toUpperCase();
  const session = await prisma.quizSession.findUnique({
    where: { roomCode },
    include: { quiz: { select: { title: true, id: true } } },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    roomCode: session.roomCode,
    status: session.status,
    phase: session.phase,
    quizTitle: session.quiz.title,
    quizId: session.quiz.id,
  });
});

router.get('/:roomCode/results', async (req, res) => {
  const roomCode = param(req.params.roomCode).toUpperCase();
  const session = await prisma.quizSession.findUnique({
    where: { roomCode },
    include: {
      participants: {
        include: {
          user: { select: { name: true, avatarUrl: true } },
          answers: true,
        },
      },
      quiz: {
        select: {
          title: true,
          questions: {
            orderBy: { order: 'asc' },
            select: { id: true, order: true, text: true, points: true },
          },
        },
      },
    },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json(buildResultsDetail(session));
});

export default router;
