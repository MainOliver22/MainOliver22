import { useEffect, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';

type EventType =
  | 'BOT_STATUS_CHANGE'
  | 'PRICE_TICK'
  | 'NEW_NOTIFICATION'
  | 'WITHDRAWAL_STATUS'
  | 'DEPOSIT_CONFIRMED'
  | 'KYC_UPDATE';

interface PlatformEvent {
  type: EventType;
  data: Record<string, unknown>;
}

type EventHandler = (event: PlatformEvent) => void;

/**
 * useSSE — connects to the `/api/events/stream` SSE endpoint and
 * invokes `onEvent` whenever the server sends a message.
 *
 * Reconnects automatically on connection loss (3-second back-off).
 * Disconnects when the component unmounts.
 */
export function useSSE(onEvent: EventHandler, enabled = true) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef<EventHandler>(onEvent);

  // Keep the handler ref fresh so reconnects always use the latest callback
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !enabled) return;

    const apiBase =
      process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000/api';
    const token = Cookies.get('accessToken');

    // EventSource doesn't support custom headers; pass the token as a query param
    // The backend SSE endpoint should accept ?token= as an alternative to the Auth header.
    const url = `${apiBase}/events/stream${token ? `?token=${token}` : ''}`;

    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(e.data) as PlatformEvent;
        onEventRef.current(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // Reconnect after 3 seconds
      retryRef.current = setTimeout(connect, 3_000);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      retryRef.current && clearTimeout(retryRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [enabled, connect]);
}
