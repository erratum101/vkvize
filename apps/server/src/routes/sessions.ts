import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { buildLeaderboard } from '../services/scoring';

const router = Router();
const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

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
        include: { user: { select: { name: true, avatarUrl: true } } },
      },
      quiz: { select: { title: true } },
    },
  });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const entries = buildLeaderboard(
    session.participants.map((p) => ({
      id: p.id,
      name: p.user?.name ?? p.guestNickname ?? 'Участник',
      avatarUrl: p.avatarUrl ?? p.user?.avatarUrl,
      totalScore: p.totalScore,
    }))
  );

  res.json({ quizTitle: session.quiz.title, roomCode: session.roomCode, leaderboard: entries });
});

export default router;
