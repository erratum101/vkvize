export enum UserRole {
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  BOTH = 'BOTH',
}

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionType {
  TEXT_SINGLE = 'TEXT_SINGLE',
  TEXT_MULTI = 'TEXT_MULTI',
  IMAGE_SINGLE = 'IMAGE_SINGLE',
  IMAGE_MULTI = 'IMAGE_MULTI',
}

export enum SessionStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export enum SessionPhase {
  LOBBY = 'LOBBY',
  QUESTION_SHOW = 'QUESTION_SHOW',
  ANSWERING = 'ANSWERING',
  QUESTION_RESULT = 'QUESTION_RESULT',
  FINISHED = 'FINISHED',
}

export interface QuizSettings {
  categories: string[];
  shuffleQuestions: boolean;
  showCorrectAfterQuestion: boolean;
  multiChoiceScoring: 'proportional' | 'all_or_nothing';
  resultDisplaySec: number;
}

export const DEFAULT_QUIZ_SETTINGS: QuizSettings = {
  categories: [],
  shuffleQuestions: false,
  showCorrectAfterQuestion: true,
  multiChoiceScoring: 'proportional',
  resultDisplaySec: 5,
};

export const WS_EVENTS = {
  SESSION_JOIN: 'session:join',
  SESSION_STATE: 'session:state',
  SESSION_ERROR: 'session:error',
  QUESTION_SHOW: 'question:show',
  QUESTION_ANSWER: 'question:answer',
  QUESTION_CLOSE: 'question:close',
  SESSION_FINISH: 'session:finish',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  PARTICIPANT_JOINED: 'participant:joined',
  PARTICIPANT_LEFT: 'participant:left',
} as const;

export interface SessionParticipantState {
  id: string;
  name: string;
  avatarUrl?: string | null;
  totalScore: number;
  isOrganizer?: boolean;
}

export interface QuestionOptionState {
  id: string;
  text: string;
  imageUrl?: string | null;
}

export interface QuestionState {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  timeLimitSec: number;
  points: number;
  order: number;
  options: QuestionOptionState[];
  correctOptionIds?: string[];
}

export interface AnswerStats {
  answeredCount: number;
  totalParticipants: number;
}

export interface SessionState {
  roomCode: string;
  phase: SessionPhase;
  status: SessionStatus;
  currentQuestionIndex: number;
  questionDeadline: number | null;
  resultDeadline: number | null;
  currentQuestion: QuestionState | null;
  participants: SessionParticipantState[];
  quizTitle: string;
  totalQuestions: number;
  answerStats: AnswerStats | null;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  avatarUrl?: string | null;
  totalScore: number;
  rank: number;
}

export interface JoinSessionPayload {
  roomCode: string;
  profileId?: string;
  guestNickname?: string;
  avatarUrl?: string | null;
  token?: string;
  role: 'organizer' | 'participant';
}

export interface AnswerPayload {
  questionId: string;
  selectedOptionIds: string[];
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VK';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function isImageQuestion(type: QuestionType): boolean {
  return type === QuestionType.IMAGE_SINGLE || type === QuestionType.IMAGE_MULTI;
}

export function isMultiChoice(type: QuestionType): boolean {
  return type === QuestionType.TEXT_MULTI || type === QuestionType.IMAGE_MULTI;
}
