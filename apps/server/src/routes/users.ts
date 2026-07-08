import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/me/history', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const [organized, participated] = await Promise.all([
    prisma.quiz.findMany({
      where: { organizerId: userId },
      include: {
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            roomCode: true,
            status: true,
            startedAt: true,
            endedAt: true,
            createdAt: true,
            _count: { select: { participants: true } },
          },
        },
        _count: { select: { questions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.sessionParticipant.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            quiz: { select: { id: true, title: true, organizerId: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 20,
    }),
  ]);

  res.json({
    organized: organized.map((q) => ({
      id: q.id,
      title: q.title,
      status: q.status,
      questionCount: q._count.questions,
      sessions: q.sessions,
    })),
    participated: participated.map((p) => ({
      id: p.id,
      totalScore: p.totalScore,
      joinedAt: p.joinedAt,
      session: {
        roomCode: p.session.roomCode,
        status: p.session.status,
        quizTitle: p.session.quiz.title,
      },
    })),
  });
});

export default router;
