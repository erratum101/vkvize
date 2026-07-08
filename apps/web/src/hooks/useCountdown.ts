'use client';

import { useEffect, useState } from 'react';

export function computeClientDeadline(
  serverDeadline: number | null | undefined,
  serverTime: number | undefined,
  fallbackSec: number
) {
  const clientNow = Date.now();
  const syncedServerNow = serverTime ?? clientNow;
  const deadlineMs = serverDeadline != null ? Number(serverDeadline) : NaN;

  if (Number.isFinite(deadlineMs)) {
    const remainingMs = Math.max(0, deadlineMs - syncedServerNow);
    return clientNow + remainingMs;
  }

  return clientNow + fallbackSec * 1000;
}

export function useCountdown(deadline: number | null | undefined) {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline || !Number.isFinite(deadline)) {
      setSeconds(null);
      return;
    }

    const tick = () => {
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [deadline]);

  return seconds;
}
