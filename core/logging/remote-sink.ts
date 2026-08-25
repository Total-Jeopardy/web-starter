import type { LogContext, LogLevel, LogSink } from '@/core/logging/app-logger';

/**
 * Server-only sink, gated on `REMOTE_LOG_URL`. Never instantiate this from
 * client code — `REMOTE_LOG_URL`/`REMOTE_LOG_BEARER_TOKEN` are server-only
 * env vars with no `NEXT_PUBLIC_` prefix and must never reach the client
 * bundle.
 */
export class RemoteSink implements LogSink {
  constructor(
    private readonly url: string,
    private readonly bearerToken?: string,
  ) {}

  write(level: LogLevel, message: string, context?: LogContext): void {
    const payload = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...context });
    void fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.bearerToken ? { Authorization: `Bearer ${this.bearerToken}` } : {}),
      },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Best-effort. A failing remote sink must never take the app down or
      // recurse into more logging.
    });
  }
}
