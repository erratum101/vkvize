import {
  SessionPhase,
  SessionState,
  QuestionState,
  QuizSettings,
  DEFAULT_QUIZ_SETTINGS,
  LeaderboardEntry,
  SessionStatus,
  AnswerStats,
} from '@vkvize/shared';
import { buildLeaderboard } from './scoring';

interface RuntimeParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
  totalScore: number;
  socketId: string;
  isOrganizer: boolean;
  userId?: string | null;
}

interface RuntimeSession {
  sessionId: string;
  roomCode: string;
  quizId: string;
  quizTitle: string;
  organizerId: string;
  phase: SessionPhase;
  currentQuestionIndex: number;
  questionDeadline: number | null;
  questions: QuestionState[];
  settings: QuizSettings;
  participants: Map<string, RuntimeParticipant>;
  organizerSocketId: string | null;
  answerTimer: NodeJS.Timeout | null;
  resultTimer: NodeJS.Timeout | null;
  resultDeadline: number | null;
  answeredParticipantIds: Set<string>;
}

class SessionManager {
  private sessions = new Map<string, RuntimeSession>();

  get(roomCode: string): RuntimeSession | undefined {
    return this.sessions.get(roomCode.toUpperCase());
  }

  create(data: Omit<RuntimeSession, 'participants' | 'organizerSocketId' | 'answerTimer' | 'resultTimer' | 'resultDeadline' | 'answeredParticipantIds'>): RuntimeSession {
    const session: RuntimeSession = {
      ...data,
      participants: new Map(),
      organizerSocketId: null,
      answerTimer: null,
      resultTimer: null,
      resultDeadline: null,
      answeredParticipantIds: new Set(),
    };
    this.sessions.set(data.roomCode.toUpperCase(), session);
    return session;
  }

  remove(roomCode: string) {
    const session = this.get(roomCode);
    if (session?.answerTimer) clearTimeout(session.answerTimer);
    if (session?.resultTimer) clearTimeout(session.resultTimer);
    this.sessions.delete(roomCode.toUpperCase());
  }

  addParticipant(roomCode: string, participant: RuntimeParticipant) {
    const session = this.get(roomCode);
    if (!session) return;
    session.participants.set(participant.id, participant);
  }

  removeParticipantBySocket(roomCode: string, socketId: string) {
    const session = this.get(roomCode);
    if (!session) return;
    for (const [id, p] of session.participants) {
      if (p.socketId === socketId) {
        session.participants.delete(id);
        break;
      }
    }
  }

  getParticipantBySocket(roomCode: string, socketId: string): RuntimeParticipant | undefined {
    const session = this.get(roomCode);
    if (!session) return;
    for (const p of session.participants.values()) {
      if (p.socketId === socketId) return p;
    }
  }

  setOrganizerSocket(roomCode: string, socketId: string) {
    const session = this.get(roomCode);
    if (session) session.organizerSocketId = socketId;
  }

  clearAnswerTimer(roomCode: string) {
    const session = this.get(roomCode);
    if (session?.answerTimer) {
      clearTimeout(session.answerTimer);
      session.answerTimer = null;
    }
  }

  setAnswerTimer(roomCode: string, timer: NodeJS.Timeout) {
    const session = this.get(roomCode);
    if (session) {
      this.clearAnswerTimer(roomCode);
      session.answerTimer = timer;
    }
  }

  clearResultTimer(roomCode: string) {
    const session = this.get(roomCode);
    if (session?.resultTimer) {
      clearTimeout(session.resultTimer);
      session.resultTimer = null;
    }
  }

  setResultTimer(roomCode: string, timer: NodeJS.Timeout) {
    const session = this.get(roomCode);
    if (session) {
      this.clearResultTimer(roomCode);
      session.resultTimer = timer;
    }
  }

  resetAnswerStats(roomCode: string) {
    const session = this.get(roomCode);
    if (session) session.answeredParticipantIds = new Set();
  }

  recordAnswer(roomCode: string, participantId: string) {
    const session = this.get(roomCode);
    if (session) session.answeredParticipantIds.add(participantId);
  }

  getParticipantCount(session: RuntimeSession) {
    return [...session.participants.values()].filter((p) => !p.isOrganizer).length;
  }

  getAnswerStats(session: RuntimeSession): AnswerStats | null {
    if (session.phase !== SessionPhase.ANSWERING && session.phase !== SessionPhase.QUESTION_RESULT) {
      return null;
    }
    const totalParticipants = this.getParticipantCount(session);
    return {
      answeredCount: session.answeredParticipantIds.size,
      totalParticipants,
    };
  }

  toState(session: RuntimeSession): SessionState {
    const currentQuestion =
      session.currentQuestionIndex >= 0 && session.currentQuestionIndex < session.questions.length
        ? this.sanitizeQuestion(session, session.questions[session.currentQuestionIndex])
        : null;

    return {
      roomCode: session.roomCode,
      phase: session.phase,
      status:
        session.phase === SessionPhase.FINISHED
          ? SessionStatus.FINISHED
          : session.phase === SessionPhase.LOBBY
            ? SessionStatus.WAITING
            : SessionStatus.IN_PROGRESS,
      currentQuestionIndex: session.currentQuestionIndex,
      questionDeadline: session.questionDeadline,
      resultDeadline: session.resultDeadline,
      currentQuestion,
      participants: [...session.participants.values()]
        .filter((p) => !p.isOrganizer)
        .map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatarUrl,
          totalScore: p.totalScore,
        })),
      quizTitle: session.quizTitle,
      totalQuestions: session.questions.length,
      answerStats: this.getAnswerStats(session),
    };
  }

  sanitizeQuestion(session: RuntimeSession, question: QuestionState): QuestionState {
    const showCorrect = session.phase === SessionPhase.QUESTION_RESULT;
    return {
      ...question,
      correctOptionIds: showCorrect
        ? question.options.filter((o) => question.correctOptionIds?.includes(o.id)).map((o) => o.id)
        : undefined,
      options: question.options.map(({ id, text, imageUrl }) => ({ id, text, imageUrl })),
    };
  }

  getLeaderboard(session: RuntimeSession): LeaderboardEntry[] {
    const participants = [...session.participants.values()]
      .filter((p) => !p.isOrganizer)
      .map((p) => ({ id: p.id, name: p.name, avatarUrl: p.avatarUrl, totalScore: p.totalScore }));
    return buildLeaderboard(participants);
  }
}

export const sessionManager = new SessionManager();
export type { RuntimeSession, RuntimeParticipant };
