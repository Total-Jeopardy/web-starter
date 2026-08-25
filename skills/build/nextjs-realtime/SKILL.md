# Next.js Realtime Skill

> WebSocket connection lifecycle, reconnect/backoff, and live-data-into-TanStack-Query wiring for this template. AI follows this when a feature needs a live/push data channel instead of (or alongside) request/response polling.

---

## Stack Alignment

- **Transport:** native `WebSocket`, base URL from `core/config/app-config.ts` (`NEXT_PUBLIC_WS_URL`)
- **State:** live messages feed into the TanStack Query cache (`queryClient.setQueryData`) or a dedicated Zustand store for connection status — never a parallel ad-hoc state system
- **Lifecycle:** owned by a hook in `presentation/hooks/`, connected/disconnected alongside the component that needs it

## When To Use

Use this skill when a feature needs a WebSocket connection: live order status, presence, chat, streaming updates. Not for one-off polling — use TanStack Query's `refetchInterval` for that instead (see Anti-Patterns).

Reference patterns:
- `skills/references/state-patterns.md`
- `skills/references/clean-code-doctrine.md`
- `skills/references/use-case-pattern.md`

---

## Connection Ownership

A realtime connection is owned by exactly one hook per feature. Do not open a socket in a component directly, and do not open more than one socket for the same logical channel.

```typescript
// features/live-orders/presentation/hooks/use-live-order-updates.ts
'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAppConfig } from '@/core/config/app-config';
import { getAppLogger } from '@/core/logging/logging-providers';

const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export function useLiveOrderUpdates(orderId: string) {
  const queryClient = useQueryClient();
  const logger = getAppLogger();
  const attemptRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const closedByCleanupRef = useRef(false);

  useEffect(() => {
    closedByCleanupRef.current = false;
    connect();

    return () => {
      closedByCleanupRef.current = true;
      socketRef.current?.close();
    };

    function connect() {
      const config = getAppConfig();
      if (!config.wsUrl) {
        logger.warn('NEXT_PUBLIC_WS_URL is not set; live order updates disabled.');
        return;
      }

      const socket = new WebSocket(`${config.wsUrl}/orders/${orderId}`);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptRef.current = 0;
      };

      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as { status: string };
        queryClient.setQueryData(['orders', orderId], (previous: Order | undefined) =>
          previous ? { ...previous, status: payload.status } : previous,
        );
      };

      socket.onerror = (event) => {
        logger.error('Live order socket error', { event });
      };

      socket.onclose = () => {
        if (closedByCleanupRef.current) return;
        scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attemptRef.current, RECONNECT_MAX_DELAY_MS);
      attemptRef.current += 1;
      setTimeout(() => {
        if (!closedByCleanupRef.current) connect();
      }, delay);
    }
  }, [orderId, queryClient, logger]);
}
```

Rules:
- One `useEffect` owns connect/reconnect/cleanup — no connection logic scattered across multiple effects
- Always guard the reconnect scheduler against firing after cleanup (`closedByCleanupRef`)
- Reconnect with exponential backoff, capped — never a tight retry loop
- Feed live data into the existing TanStack Query cache key for that resource (`['orders', orderId]`) so the rest of the UI (which reads via `useQuery`) updates for free — do not create a second source of truth for the same data

---

## Connection Status As State

Expose connection status (`connecting`/`open`/`reconnecting`/`closed`) through a small local `useState` in the same hook, or a dedicated per-feature Zustand slice if more than one component needs to read it. Do not put transient connection status in the TanStack Query cache — it isn't server data.

```typescript
const [status, setStatus] = useState<'connecting' | 'open' | 'reconnecting' | 'closed'>('connecting');
// set inside onopen / onclose / scheduleReconnect
return { status };
```

---

## Message Handling

- Validate incoming payload shape before writing it into the cache (a minimal runtime check or a Zod schema — do not trust the wire format blindly, even on an internal socket).
- Keep message-to-domain mapping in the same place the equivalent REST DTO mapping would live (repository-shaped), not inlined into the `onmessage` handler for anything non-trivial.
- Never call `setQueryData` with a shape that doesn't match what `useQuery` for that key would normally produce — components read both interchangeably.

```typescript
socket.onmessage = (event) => {
  const parsed = liveOrderMessageSchema.safeParse(JSON.parse(event.data));
  if (!parsed.success) {
    logger.warn('Dropped malformed live order message', { issues: parsed.error.issues });
    return;
  }
  queryClient.setQueryData(['orders', orderId], mapLiveMessageToOrder(parsed.data));
};
```

---

## Auth On The Socket

If the channel requires auth, read the token the same way `core/network/api-client.ts` does — via `core/auth/token-storage-provider.ts` — and pass it as a query param or a post-connect auth message per the backend's protocol. Never hardcode a token or read it from anywhere but `TokenStorage`.

```typescript
const token = await getTokenStorage().getAccessToken();
const socket = new WebSocket(`${config.wsUrl}/orders/${orderId}?token=${encodeURIComponent(token ?? '')}`);
```

---

## Anti-Patterns

| ❌ NEVER | ✅ ALWAYS |
|---|---|
| Open a WebSocket directly inside a component's JSX-adjacent code | Own it in a `presentation/hooks/` hook |
| Reconnect in a tight loop with no backoff | Exponential backoff with a max delay |
| Use a WebSocket for data that's fine polled every N seconds | `useQuery({ refetchInterval })` |
| Create a second state store that duplicates a `useQuery` key | Write live updates into the existing query cache key |
| Trust incoming message shape without validation | Parse/validate before writing to state |
| Leave the socket open after the owning component unmounts | Close in the `useEffect` cleanup, guarded against a reconnect race |
| Store the auth token in the socket hook's own state | Read fresh from `core/auth/token-storage-provider.ts` |

---

## Realtime Checklist

- [ ] Connection lifecycle owned by one hook, cleaned up on unmount
- [ ] Reconnect uses capped exponential backoff, not a tight loop
- [ ] Live updates write into the existing TanStack Query cache key, not a parallel store
- [ ] Incoming messages are validated before being applied
- [ ] Auth token (if any) is read from `TokenStorage`, not hardcoded or cached locally
- [ ] Connection status is exposed as local/Zustand state, not stuffed into the query cache
- [ ] `NEXT_PUBLIC_WS_URL` absence is handled gracefully (logged, feature no-ops) rather than throwing
