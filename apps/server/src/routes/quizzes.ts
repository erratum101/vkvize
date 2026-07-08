import { Router } from 'express';
import { z } from 'zod';
import { Prisma, QuestionType } from '@prisma/client';
import { DEFAULT_QUIZ_SETTINGS } from '@vkvize/shared';
import { prisma } from '../lib/prisma';
import { createQuizSession } from '../services/sessionFactory';
import { requireLocalUser } from '../lib/localProfile';

const router = Router();

const id = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

const quizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

const optionSchema = z.object({
  text: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  isCorrect: z.boolean(),
  order: z.number().int().optional(),
});

const questionSchema = z.object({
  type: z.nativeEnum(QuestionType),
  text: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  timeLimitSec: z.number().int().min(5).max(300).optional(),
  points: z.number().int().min(1).max(1000).optional(),
  order: z.number().int().optional(),
  categoryId: z.string().uuid().optional().nullable(),
  options: z.array(optionSchema).min(2),
});

async function getOwnedQuiz(quizId: string, userId: string) {
  return prisma.quiz.findFirst({ where: { id: quizId, organizerId: userId } });
}

router.get('/', async (req, res) => {
  const user = await requireLocalUser(req);
  if (!user) return res.status(401).json({ error: 'Profile required' });
  const quizzes = await prisma.quiz.findMany({
    where: { organizerId: user.id },
    include: { _count: { select: { questions: true, sessions: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(quizzes);
});

router.post('/', async (req, res) => {
  try {
    const user = await requireLocalUser(req);
    if (!user) return res.status(401).json({ error: 'Profile required' });
    const data = quizSchema.parse(req.body);
    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        settings: (data.settings ?? DEFAULT_QUIZ_SETTINGS) as Prisma.InputJsonValue,
        organizerId: user.id,
      },
    });
    res.status(201).json(quiz);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

router.get('/:id', async (req, res) => {
  const user = await requireLocalUser(req);
  if (!user) return res.status(401).json({ error: 'Profile required' });
  const quizId = id(req.params.id);
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { options: { orderBy: { order: 'asc' } }, category: true },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  if (quiz.organizerId !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(quiz);
});

router.put('/:id', async (req, res) => {
  try {
    const user = await requireLocalUser(req);
    if (!user) return res.status(401).json({ error: 'Profile required' });
    const quizId = id(req.params.id);
    const quiz = await getOwnedQuiz(quizId, user.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const data = quizSchema.partial().parse(req.body);
    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: {
        title: data.title,
        description: data.description,
        settings: data.settings ? (data.settings as Prisma.InputJsonValue) : undefined,
      },
    });
    res.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

router.delete('/:id', async (req, res) => {
  const user = await requireLocalUser(req);
  if (!user) return res.status(401).json({ error: 'Profile required' });
  const quiz = await getOwnedQuiz(id(req.params.id), user.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  await prisma.quiz.delete({ where: { id: quiz.id } });
  res.status(204).send();
});

router.post('/:id/questions', async (req, res) => {
  try {
    const user = await requireLocalUser(req);
    if (!user) return res.status(401).json({ error: 'Profile required' });
    const quizId = id(req.params.id);
    const quiz = await getOwnedQuiz(quizId, user.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const data = questionSchema.parse(req.body);
    const count = await prisma.question.count({ where: { quizId: quiz.id } });

    const question = await prisma.question.create({
      data: {
        quizId: quiz.id,
        type: data.type,
        text: data.text,
        imageUrl: data.imageUrl,
        timeLimitSec: data.timeLimitSec ?? 30,
        points: data.points ?? 100,
        order: data.order ?? count,
        categoryId: data.categoryId,
        options: {
          create: data.options.map((o, i) => ({
            text: o.text,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
            order: o.order ?? i,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    res.status(201).json(question);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/:quizId/questions/:questionId', async (req, res) => {
  try {
    const user = await requireLocalUser(req);
    if (!user) return res.status(401).json({ error: 'Profile required' });
    const quizId = id(req.params.quizId);
    const questionId = id(req.params.questionId);
    const quiz = await getOwnedQuiz(quizId, user.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const data = questionSchema.parse(req.body);
    await prisma.answerOption.deleteMany({ where: { questionId } });

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        type: data.type,
        text: data.text,
        imageUrl: data.imageUrl,
        timeLimitSec: data.timeLimitSec,
        points: data.points,
        order: data.order,
        categoryId: data.categoryId,
        options: {
          create: data.options.map((o, i) => ({
            text: o.text,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
            order: o.order ?? i,
          })),
        },
      },
      include: { options: { orderBy: { order: 'asc' } } },
    });
    res.json(question);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors });
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/:quizId/questions/:questionId', async (req, res) => {
  const user = await requireLocalUser(req);
  if (!user) return res.status(401).json({ error: 'Profile required' });
  const quiz = await getOwnedQuiz(id(req.params.quizId), user.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  await prisma.question.delete({ where: { id: id(req.params.questionId) } });
  res.status(204).send();
});

router.post('/:id/sessions', async (req, res) => {
  try {
    const user = await requireLocalUser(req);
    if (!user) return res.status(401).json({ error: 'Profile required' });
    const result = await createQuizSession(id(req.params.id), user.id);
    if (!result) return res.status(404).json({ error: 'Quiz not found' });
    if ('error' in result) {
      return res.status(400).json({ error: 'Quiz must include at least two questions' });
    }
    res.status(201).json({ ...result.session, joinUrl: `/join?code=${result.roomCode}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

export default router;
