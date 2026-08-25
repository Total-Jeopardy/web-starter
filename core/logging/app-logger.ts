export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface LogSink {
  write(level: LogLevel, message: string, context?: LogContext): void;
}

const levelOrder: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/**
 * Structured logger with pluggable sinks — the web analogue of the Flutter
 * template's `AppLogger`. Emits structured JSON, filters by the configured
 * `NEXT_PUBLIC_LOG_LEVEL`, and fans out to every registered sink.
 */
export class AppLogger {
  constructor(
    private readonly minLevel: LogLevel,
    private readonly sinks: LogSink[],
  ) {}

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (levelOrder[level] < levelOrder[this.minLevel]) return;
    for (const sink of this.sinks) {
      sink.write(level, message, context);
    }
  }
}
