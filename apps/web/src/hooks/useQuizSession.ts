'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  WS_EVENTS,
  SessionState,
  LeaderboardEntry,
  SessionPhase,
} from '@vkvize/shared';
import { LocalProfile } from '@/lib/local-profile';
import { getWsUrl } from '@/lib/service-url';

export function useQuizSession(roomCode: string, role: 'organizer' | 'participant', profile?: LocalProfile | null) {
  const [connected, setConnected] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

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

  const timeLeft = sessionState?.questionDeadline
    ? Math.max(0, Math.ceil((sessionState.questionDeadline - Date.now()) / 1000))
    : null;

  return {
    connected,
    sessionState,
    leaderboard,
    participantId,
    error,
    timeLeft,
    phase: sessionState?.phase as SessionPhase | undefined,
    showQuestion,
    closeQuestion,
    finishSession,
    submitAnswer,
  };
}
