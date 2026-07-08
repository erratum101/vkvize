import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  WS_EVENTS,
  SessionPhase,
  JoinSessionPayload,
  AnswerPayload,
  QuizSettings,
  DEFAULT_QUIZ_SETTINGS,
  QuestionType,
} from '@vkvize/shared';
import { prisma } from '../lib/prisma';
import { sessionManager } from '../services/sessionManager';
import { calculateScore } from '../services/scoring';
import { ensureLocalUser } from '../lib/localProfile';

function emitState(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session) return;
  io.to(roomCode).emit(WS_EVENTS.SESSION_STATE, sessionManager.toState(session));
}

function emitLeaderboard(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session) return;
  io.to(roomCode).emit(WS_EVENTS.LEADERBOARD_UPDATE, sessionManager.getLeaderboard(session));
}

async function persistParticipantScore(participantId: string, totalScore: number) {
  await prisma.sessionParticipant.update({
    where: { id: participantId },
    data: { totalScore },
  });
}

function getResultDisplaySec(settings: QuizSettings) {
  return settings.resultDisplaySec ?? DEFAULT_QUIZ_SETTINGS.resultDisplaySec;
}

async function finishSessionInternal(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session) return;

  sessionManager.clearAnswerTimer(roomCode);
  sessionManager.clearResultTimer(roomCode);
  session.phase = SessionPhase.FINISHED;
  session.questionDeadline = null;
  session.resultDeadline = null;

  await prisma.quizSession.update({
    where: { id: session.sessionId },
    data: { phase: SessionPhase.FINISHED, status: 'FINISHED', endedAt: new Date() },
  });

  emitState(io, roomCode);
  emitLeaderboard(io, roomCode);
}

async function showNextQuestion(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session) return false;

  const nextIndex = session.currentQuestionIndex + 1;
  if (nextIndex >= session.questions.length) return false;

  sessionManager.clearResultTimer(roomCode);
  sessionManager.resetAnswerStats(roomCode);

  const question = session.questions[nextIndex];
  session.currentQuestionIndex = nextIndex;
  session.phase = SessionPhase.ANSWERING;
  session.questionDeadline = Date.now() + question.timeLimitSec * 1000;
  session.resultDeadline = null;

  emitState(io, roomCode);

  await prisma.quizSession.update({
    where: { id: session.sessionId },
    data: {
      phase: SessionPhase.ANSWERING,
      currentQuestionIndex: nextIndex,
      status: 'IN_PROGRESS',
      startedAt: nextIndex === 0 ? new Date() : undefined,
    },
  });

  sessionManager.setAnswerTimer(
    roomCode,
    setTimeout(() => closeQuestion(io, roomCode), question.timeLimitSec * 1000)
  );

  return true;
}

async function advanceAfterResult(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session || session.phase !== SessionPhase.QUESTION_RESULT) return;

  session.resultDeadline = null;
  const hasMore = session.currentQuestionIndex < session.questions.length - 1;
  if (hasMore) {
    await showNextQuestion(io, roomCode);
  } else {
    await finishSessionInternal(io, roomCode);
  }
}

async function closeQuestion(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session || session.phase !== SessionPhase.ANSWERING) return;

  sessionManager.clearAnswerTimer(roomCode);
  session.phase = SessionPhase.QUESTION_RESULT;
  session.questionDeadline = null;
  const resultDisplaySec = getResultDisplaySec(session.settings);
  session.resultDeadline = Date.now() + resultDisplaySec * 1000;

  emitState(io, roomCode);
  emitLeaderboard(io, roomCode);

  await prisma.quizSession.update({
    where: { id: session.sessionId },
    data: { phase: SessionPhase.QUESTION_RESULT },
  });

  sessionManager.setResultTimer(
    roomCode,
    setTimeout(() => advanceAfterResult(io, roomCode), resultDisplaySec * 1000)
  );
}

function maybeCloseIfAllAnswered(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session || session.phase !== SessionPhase.ANSWERING) return;

  const totalParticipants = sessionManager.getParticipantCount(session);
  if (totalParticipants === 0) return;
  if (session.answeredParticipantIds.size < totalParticipants) return;

  void closeQuestion(io, roomCode);
}

function ensureQuestionTiming(io: Server, roomCode: string) {
  const session = sessionManager.get(roomCode);
  if (!session) return;

  if (session.phase === SessionPhase.ANSWERING) {
    if (!session.questionDeadline) {
      const question = session.questions[session.currentQuestionIndex];
      if (question) {
        session.questionDeadline = Date.now() + question.timeLimitSec * 1000;
        sessionManager.setAnswerTimer(
          roomCode,
          setTimeout(() => closeQuestion(io, roomCode), question.timeLimitSec * 1000)
        );
        emitState(io, roomCode);
      }
      return;
    }

    const remainingMs = session.questionDeadline - Date.now();
    if (remainingMs <= 0) {
      void closeQuestion(io, roomCode);
      return;
    }

    sessionManager.setAnswerTimer(
      roomCode,
      setTimeout(() => closeQuestion(io, roomCode), remainingMs)
    );
    return;
  }

  if (session.phase === SessionPhase.QUESTION_RESULT) {
    if (!session.resultDeadline) {
      const resultDisplaySec = getResultDisplaySec(session.settings);
      session.resultDeadline = Date.now() + resultDisplaySec * 1000;
      sessionManager.setResultTimer(
        roomCode,
        setTimeout(() => advanceAfterResult(io, roomCode), resultDisplaySec * 1000)
      );
      emitState(io, roomCode);
      return;
    }

    const remainingMs = session.resultDeadline - Date.now();
    if (remainingMs <= 0) {
      void advanceAfterResult(io, roomCode);
      return;
    }

    sessionManager.setResultTimer(
      roomCode,
      setTimeout(() => advanceAfterResult(io, roomCode), remainingMs)
    );
  }
}

export function setupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    let joinedRoom: string | null = null;

    socket.on(WS_EVENTS.SESSION_JOIN, async (payload: JoinSessionPayload, ack?: (res: unknown) => void) => {
      try {
        const roomCode = payload.roomCode.toUpperCase();
        let session = sessionManager.get(roomCode);

        if (!session) {
          const dbSession = await prisma.quizSession.findUnique({
            where: { roomCode },
            include: {
              quiz: {
                include: {
                  questions: {
                    include: { options: { orderBy: { order: 'asc' } } },
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          });
          if (!dbSession || dbSession.status === 'FINISHED') {
            ack?.({ error: 'Session not found or finished' });
            return;
          }

          const settings = (dbSession.quiz.settings as unknown as QuizSettings) ?? DEFAULT_QUIZ_SETTINGS;
          session = sessionManager.create({
            sessionId: dbSession.id,
            roomCode,
            quizId: dbSession.quizId,
            quizTitle: dbSession.quiz.title,
            organizerId: dbSession.quiz.organizerId,
            phase: dbSession.phase as SessionPhase,
            currentQuestionIndex: dbSession.currentQuestionIndex,
            questionDeadline: null,
            questions: dbSession.quiz.questions.map((q) => ({
              id: q.id,
              type: q.type as QuestionType,
              text: q.text,
              imageUrl: q.imageUrl,
              timeLimitSec: q.timeLimitSec,
              points: q.points,
              order: q.order,
              options: q.options.map((o) => ({ id: o.id, text: o.text, imageUrl: o.imageUrl })),
              correctOptionIds: q.options.filter((o) => o.isCorrect).map((o) => o.id),
            })),
            settings,
          });
          ensureQuestionTiming(io, roomCode);
        }

        if (payload.role === 'organizer') {
          if (!payload.profileId || !payload.guestNickname) {
            ack?.({ error: 'Profile required for organizer' });
            return;
          }
          if (payload.profileId !== session.organizerId) {
            ack?.({ error: 'Not quiz organizer' });
            return;
          }

          const user = await ensureLocalUser({
            id: payload.profileId,
            name: payload.guestNickname,
            avatarUrl: payload.avatarUrl,
          });

          sessionManager.setOrganizerSocket(roomCode, socket.id);
          const organizerParticipant = {
            id: `org-${user.id}`,
            name: payload.guestNickname,
            avatarUrl: payload.avatarUrl,
            totalScore: 0,
            socketId: socket.id,
            isOrganizer: true,
            userId: user.id,
          };
          sessionManager.addParticipant(roomCode, organizerParticipant);

          joinedRoom = roomCode;
          socket.join(roomCode);
          ack?.({ success: true, participantId: organizerParticipant.id, role: 'organizer' });
          emitState(io, roomCode);
          return;
        }

        // Participant join
        let name = payload.guestNickname?.trim();
        let userId: string | null = null;

        if (payload.profileId && name) {
          const user = await ensureLocalUser({
            id: payload.profileId,
            name,
            avatarUrl: payload.avatarUrl,
          });
          userId = user.id;
          name = user.name;
        }

        if (!name) {
          ack?.({ error: 'Nickname required for guest' });
          return;
        }

        let dbParticipant = userId
          ? await prisma.sessionParticipant.findFirst({
              where: { sessionId: session.sessionId, userId },
            })
          : null;

        if (!dbParticipant) {
          dbParticipant = await prisma.sessionParticipant.create({
            data: {
              sessionId: session.sessionId,
              userId,
              guestNickname: userId ? null : name,
              avatarUrl: payload.avatarUrl,
            },
          });
        } else if (payload.avatarUrl && dbParticipant.avatarUrl !== payload.avatarUrl) {
          dbParticipant = await prisma.sessionParticipant.update({
            where: { id: dbParticipant.id },
            data: { avatarUrl: payload.avatarUrl },
          });
        }

        const participant = {
          id: dbParticipant.id,
          name,
          avatarUrl: dbParticipant.avatarUrl ?? payload.avatarUrl,
          totalScore: dbParticipant.totalScore,
          socketId: socket.id,
          isOrganizer: false,
          userId,
        };

        sessionManager.addParticipant(roomCode, participant);
        joinedRoom = roomCode;
        socket.join(roomCode);

        io.to(roomCode).emit(WS_EVENTS.PARTICIPANT_JOINED, { id: participant.id, name: participant.name });
        ack?.({ success: true, participantId: participant.id, role: 'participant' });
        emitState(io, roomCode);
      } catch (e) {
        console.error('session:join error', e);
        ack?.({ error: 'Join failed' });
      }
    });

    socket.on(WS_EVENTS.QUESTION_SHOW, async (_payload, ack?: (res: unknown) => void) => {
      if (!joinedRoom) return ack?.({ error: 'Not in room' });
      const session = sessionManager.get(joinedRoom);
      if (!session || session.organizerSocketId !== socket.id) {
        return ack?.({ error: 'Only organizer can show questions' });
      }

      const started = await showNextQuestion(io, joinedRoom);
      if (!started) return ack?.({ error: 'No more questions' });

      ack?.({ success: true });
    });

    socket.on(WS_EVENTS.QUESTION_ANSWER, async (payload: AnswerPayload, ack?: (res: unknown) => void) => {
      if (!joinedRoom) return ack?.({ error: 'Not in room' });
      const session = sessionManager.get(joinedRoom);
      const participant = sessionManager.getParticipantBySocket(joinedRoom, socket.id);

      if (!session || !participant || participant.isOrganizer) {
        return ack?.({ error: 'Invalid participant' });
      }
      if (session.phase !== SessionPhase.ANSWERING) {
        return ack?.({ error: 'Not accepting answers' });
      }
      if (session.questionDeadline && Date.now() > session.questionDeadline) {
        return ack?.({ error: 'Time expired' });
      }

      const question = session.questions[session.currentQuestionIndex];
      if (!question || question.id !== payload.questionId) {
        return ack?.({ error: 'Wrong question' });
      }

      const existing = await prisma.participantAnswer.findUnique({
        where: {
          participantId_questionId: {
            participantId: participant.id,
            questionId: question.id,
          },
        },
      });
      if (existing) return ack?.({ error: 'Already answered' });

      const options = question.correctOptionIds
        ? question.options.map((o) => ({
            id: o.id,
            isCorrect: question.correctOptionIds!.includes(o.id),
          }))
        : [];

      const { isCorrect, pointsEarned } = calculateScore(
        question.type,
        options,
        payload.selectedOptionIds,
        question.points,
        session.settings
      );

      await prisma.participantAnswer.create({
        data: {
          participantId: participant.id,
          questionId: question.id,
          selectedOptionIds: payload.selectedOptionIds,
          isCorrect,
          pointsEarned,
        },
      });

      participant.totalScore += pointsEarned;
      await persistParticipantScore(participant.id, participant.totalScore);

      sessionManager.recordAnswer(joinedRoom, participant.id);

      ack?.({ success: true, pointsEarned, isCorrect });
      emitState(io, joinedRoom);
      emitLeaderboard(io, joinedRoom);
      maybeCloseIfAllAnswered(io, joinedRoom);
    });

    socket.on(WS_EVENTS.QUESTION_CLOSE, async (_payload, ack?: (res: unknown) => void) => {
      if (!joinedRoom) return ack?.({ error: 'Not in room' });
      const session = sessionManager.get(joinedRoom);
      if (!session || session.organizerSocketId !== socket.id) {
        return ack?.({ error: 'Only organizer' });
      }
      await closeQuestion(io, joinedRoom);
      ack?.({ success: true });
    });

    socket.on(WS_EVENTS.SESSION_FINISH, async (_payload, ack?: (res: unknown) => void) => {
      if (!joinedRoom) return ack?.({ error: 'Not in room' });
      const session = sessionManager.get(joinedRoom);
      if (!session || session.organizerSocketId !== socket.id) {
        return ack?.({ error: 'Only organizer' });
      }

      await finishSessionInternal(io, joinedRoom);
      ack?.({ success: true });
    });

    socket.on('disconnect', () => {
      if (!joinedRoom) return;
      const session = sessionManager.get(joinedRoom);
      const participant = sessionManager.getParticipantBySocket(joinedRoom, socket.id);
      if (participant && !participant.isOrganizer) {
        io.to(joinedRoom).emit(WS_EVENTS.PARTICIPANT_LEFT, { id: participant.id, name: participant.name });
      }
      sessionManager.removeParticipantBySocket(joinedRoom, socket.id);
      if (session?.organizerSocketId === socket.id) {
        session.organizerSocketId = null;
      }
      emitState(io, joinedRoom);
    });
  });
}
