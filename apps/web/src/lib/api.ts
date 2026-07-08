import { SessionResultsDetail } from '@vkvize/shared';
import { getProfileHeaders } from './local-profile';
import { getApiUrl } from './service-url';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: 'ORGANIZER' | 'PARTICIPANT' | 'BOTH';
}

function formatApiError(error: unknown, status: number): string {
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) {
    const lines = error.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const issue = item as { path?: (string | number)[]; message?: string };
        const field = issue.path?.length ? issue.path.join('.') : 'field';
        return issue.message ? `${field}: ${issue.message}` : JSON.stringify(item);
      }
      return String(item);
    });
    return lines.join('\n') || `HTTP ${status}`;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return error != null ? JSON.stringify(error) : `HTTP ${status}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getProfileHeaders(),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(formatApiError(body.error, res.status));
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  syncProfile: (data: { name: string; role?: string; avatarUrl?: string | null }) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  me: () => request<User>('/api/users/me'),
  history: () => request<{ organized: unknown[]; participated: unknown[] }>('/api/users/me/history'),
  categories: () => request<{ id: string; name: string }[]>('/api/categories'),
  quizzes: {
    list: () => request<Quiz[]>('/api/quizzes'),
    get: (id: string) => request<QuizDetail>(`/api/quizzes/${id}`),
    create: (data: { title: string; description?: string }) =>
      request<Quiz>('/api/quizzes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ title: string; description: string; settings: unknown }>) =>
      request<Quiz>(`/api/quizzes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/api/quizzes/${id}`, { method: 'DELETE' }),
    addQuestion: (quizId: string, data: QuestionInput) =>
      request<Question>(`/api/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateQuestion: (quizId: string, questionId: string, data: QuestionInput) =>
      request<Question>(`/api/quizzes/${quizId}/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteQuestion: (quizId: string, questionId: string) =>
      request<void>(`/api/quizzes/${quizId}/questions/${questionId}`, { method: 'DELETE' }),
    createSession: (quizId: string) =>
      request<QuizSession>(`/api/quizzes/${quizId}/sessions`, { method: 'POST' }),
  },
  sessions: {
    get: (roomCode: string) => request<SessionInfo>(`/api/sessions/${roomCode}`),
    results: (roomCode: string) => request<SessionResultsDetail>(`/api/sessions/${roomCode}/results`),
  },
  upload: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${getApiUrl()}/api/upload`, {
      method: 'POST',
      headers: getProfileHeaders(),
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(formatApiError(body.error, res.status));
    }
    return res.json() as Promise<{ url: string }>;
  },
};

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  status: string;
  _count?: { questions: number; sessions: number };
}

export interface QuizDetail extends Quiz {
  questions: Question[];
  settings?: Record<string, unknown>;
}

export interface Question {
  id: string;
  type: string;
  text: string;
  imageUrl?: string | null;
  timeLimitSec: number;
  points: number;
  order: number;
  categoryId?: string | null;
  options: AnswerOption[];
}

export interface AnswerOption {
  id: string;
  text: string;
  imageUrl?: string | null;
  isCorrect: boolean;
  order: number;
}

export interface QuestionInput {
  type: string;
  text: string;
  imageUrl?: string | null;
  timeLimitSec?: number;
  points?: number;
  order?: number;
  categoryId?: string | null;
  options: { text: string; imageUrl?: string | null; isCorrect: boolean; order?: number }[];
}

export interface QuizSession {
  id: string;
  roomCode: string;
  status: string;
  joinUrl?: string;
}

export interface SessionInfo {
  roomCode: string;
  status: string;
  phase: string;
  quizTitle: string;
  quizId: string;
}

export interface LeaderboardEntry {
  participantId: string;
  name: string;
  avatarUrl?: string | null;
  totalScore: number;
  rank: number;
}

export function uploadUrl(url: string) {
  if (!url) return '';
  return url;
}

