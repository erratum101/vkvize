'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  WS_EVENTS,
  SessionState,
  LeaderboardEntry,
  SessionPhase,
  DEFAULT_QUIZ_SETTINGS,
} from '@vkvize/shared';
import { LocalProfile } from '@/lib/local-profile';
import { getWsUrl } from '@/lib/service-url';
import { useCountdown } from './useCountdown';

function syncDeadlineFromServerSeconds(seconds: number | null | undefined, fallbackSec: number) {
  const remaining = seconds != null && Number.isFinite(seconds) ? Math.max(0, seconds) : fallbackSec;
  return Date.now() + remaining * 1000;
}

export function useQuizSession(roomCode: string, role: 'organizer' | 'participant', profile?: LocalProfile | null) {
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answerDeadline, setAnswerDeadline] = useState<number | null>(null);
  const [resultDeadlineLocal, setResultDeadlineLocal] = useState<number | null>(null);
  const prevPhaseRef = useRef<SessionPhase | undefined>(undefined);
  const prevQuestionIndexRef = useRef(-1);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionState) {
      setAnswerDeadline(null);
      setResultDeadlineLocal(null);
      prevPhaseRef.current = undefined;
      prevQuestionIndexRef.current = -1;
      return;
    }

    const { phase, currentQuestionIndex, currentQuestion } = sessionState;
    const enteredAnswering =
      phase === SessionPhase.ANSWERING &&
      (prevPhaseRef.current !== SessionPhase.ANSWERING || prevQuestionIndexRef.current !== currentQuestionIndex);
    const enteredResult =
      phase === SessionPhase.QUESTION_RESULT &&
      (prevPhaseRef.current !== SessionPhase.QUESTION_RESULT || prevQuestionIndexRef.current !== currentQuestionIndex);

    if (enteredAnswering && currentQuestion) {
      setAnswerDeadline(
        syncDeadlineFromServerSeconds(
          sessionState.questionTimeLeftSec,
          currentQuestion.timeLimitSec
        )
      );
      setResultDeadlineLocal(null);
    } else if (enteredResult) {
      const sec = sessionState.resultTimeLeftSec;
      const initialSec = sec != null && sec > 0 ? sec : DEFAULT_QUIZ_SETTINGS.resultDisplaySec;
      setResultDeadlineLocal(Date.now() + initialSec * 1000);
      setAnswerDeadline(null);
    } else if (phase === SessionPhase.QUESTION_RESULT && sessionState.resultTimeLeftSec != null) {
      setResultDeadlineLocal((prev) => {
        const next = syncDeadlineFromServerSeconds(
          sessionState.resultTimeLeftSec,
          DEFAULT_QUIZ_SETTINGS.resultDisplaySec
        );
        if (!prev) return next;
        const prevSec = Math.ceil((prev - Date.now()) / 1000);
        const nextSec = sessionState.resultTimeLeftSec ?? 0;
        return nextSec > prevSec ? next : prev;
      });
    } else if (phase === SessionPhase.ANSWERING && sessionState.questionTimeLeftSec != null) {
      setAnswerDeadline((prev) => {
        const next = syncDeadlineFromServerSeconds(
          sessionState.questionTimeLeftSec,
          currentQuestion?.timeLimitSec ?? DEFAULT_QUIZ_SETTINGS.resultDisplaySec
        );
        if (!prev) return next;
        const prevSec = Math.ceil((prev - Date.now()) / 1000);
        const nextSec = sessionState.questionTimeLeftSec ?? 0;
        return nextSec > prevSec ? next : prev;
      });
    } else if (phase !== SessionPhase.ANSWERING && phase !== SessionPhase.QUESTION_RESULT) {
      setAnswerDeadline(null);
      setResultDeadlineLocal(null);
    }

    prevPhaseRef.current = phase;
    prevQuestionIndexRef.current = currentQuestionIndex;
  }, [sessionState]);

  useEffect(() => {
    if (!roomCode) return;

    const socket = io(getWsUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit(
        WS_EVENTS.SESSION_JOIN,
        {
          roomCode: roomCode.toUpperCase(),
          role,
          profileId: profile?.id,
          guestNickname: profile?.name,
          avatarUrl: profile?.avatarUrl,
        },
        (res: { success?: boolean; error?: string; participantId?: string }) => {
          if (res.error) setError(res.error);
          else if (res.participantId) setParticipantId(res.participantId);
        }
      );
    });

    socket.on(WS_EVENTS.SESSION_STATE, (state: SessionState) => setSessionState(state));
    socket.on(WS_EVENTS.LEADERBOARD_UPDATE, (lb: LeaderboardEntry[]) => setLeaderboard(lb));
    socket.on(WS_EVENTS.SESSION_ERROR, (err: { message: string }) => setError(err.message));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
    };
  }, [roomCode, role, profile?.id, profile?.name, profile?.avatarUrl]);

  const showQuestion = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      socketRef.current?.emit(WS_EVENTS.QUESTION_SHOW, {}, (res: { success?: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const closeQuestion = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      socketRef.current?.emit(WS_EVENTS.QUESTION_CLOSE, {}, (res: { success?: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const finishSession = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      socketRef.current?.emit(WS_EVENTS.SESSION_FINISH, {}, (res: { success?: boolean; error?: string }) => {
        if (res.error) reject(new Error(res.error));
        else resolve();
      });
    });
  }, []);

  const submitAnswer = useCallback((questionId: string, selectedOptionIds: string[]) => {
    return new Promise<{ pointsEarned: number; isCorrect: boolean }>((resolve, reject) => {
      socketRef.current?.emit(
        WS_EVENTS.QUESTION_ANSWER,
        { questionId, selectedOptionIds },
        (res: { success?: boolean; error?: string; pointsEarned?: number; isCorrect?: boolean }) => {
          if (res.error) reject(new Error(res.error));
          else resolve({ pointsEarned: res.pointsEarned ?? 0, isCorrect: res.isCorrect ?? false });
        }
      );
    });
  }, []);

  const timeLeft = useCountdown(answerDeadline);
  const resultTimeLeft = useCountdown(resultDeadlineLocal);

  return {
    connected,
    sessionState,
    leaderboard,
    participantId,
    error,
    timeLeft,
    resultTimeLeft,
    phase: sessionState?.phase as SessionPhase | undefined,
    showQuestion,
    closeQuestion,
    finishSession,
    submitAnswer,
  };
}
