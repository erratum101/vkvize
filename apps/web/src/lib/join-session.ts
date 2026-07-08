import { io } from 'socket.io-client';
import { WS_EVENTS } from '@vkvize/shared';
import { api } from './api';
import { LocalProfile } from './local-profile';
import { getWsUrl } from './service-url';

const JOIN_ERROR_MESSAGES: Record<string, string> = {
  'Session not found or finished': 'Сессия завершена',
  'Session not found': 'Неверный код',
  'Nickname required for guest': 'Введите имя',
  'Request failed': 'Не удалось связаться с сервером',
};

export function mapJoinError(message: string): string {
  return JOIN_ERROR_MESSAGES[message] || message || 'Не удалось подключиться к сессии';
}

export function isRoomCodeJoinError(message: string): boolean {
  const mapped = mapJoinError(message);
  return (
    mapped.includes('код') ||
    mapped.includes('Сессия') ||
    mapped.includes('найдена') ||
    mapped.includes('завершена')
  );
}

export async function attemptJoinSession(roomCode: string, profile: LocalProfile): Promise<void> {
  const code = roomCode.toUpperCase().trim();

  try {
    const session = await api.sessions.get(code);
    if (session.status === 'FINISHED') {
      throw new Error('Session not found or finished');
    }
  } catch (err) {
    if (err instanceof Error && err.message) {
      throw new Error(err.message);
    }
    throw new Error('Request failed');
  }

  await new Promise<void>((resolve, reject) => {
    const socket = io(getWsUrl(), { transports: ['websocket', 'polling'] });
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.disconnect();
      fn();
    };

    const timeout = setTimeout(() => {
      finish(() => reject(new Error('Превышено время ожидания. Проверьте соединение')));
    }, 12000);

    socket.on('connect_error', () => {
      finish(() => reject(new Error('Request failed')));
    });

    socket.on('connect', () => {
      socket.emit(
        WS_EVENTS.SESSION_JOIN,
        {
          roomCode: code,
          role: 'participant',
          profileId: profile.id,
          guestNickname: profile.name,
          avatarUrl: profile.avatarUrl,
        },
        (res: { success?: boolean; error?: string; participantId?: string }) => {
          if (res.error) {
            finish(() => reject(new Error(res.error)));
            return;
          }
          if (res.participantId || res.success) {
            finish(() => resolve());
            return;
          }
          finish(() => reject(new Error('Не удалось подключиться')));
        }
      );
    });
  });
}
