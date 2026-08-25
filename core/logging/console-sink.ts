import type { LogContext, LogLevel, LogSink } from '@/core/logging/app-logger';

const REDACT_KEYS = new Set(['authorization', 'cookie', 'set-cookie', 'password', 'token']);

function redact(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  const result: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    result[key] = REDACT_KEYS.has(key.toLowerCase()) ? '<redacted>' : value;
  }
  return result;
}

/** Always-on sink. Emits structured JSON lines to the console. */
export class ConsoleSink implements LogSink {
  write(level: LogLevel, message: string, context?: LogContext): void {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...redact(context),
    };
    const line = JSON.stringify(payload);
    switch (level) {
      case 'debug':
      case 'info':
        // eslint-disable-next-line no-console -- intentional structured log output
        console.log(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'error':
        console.error(line);
        break;
    }
  }
}
