import { AppLogger, type LogSink } from '@/core/logging/app-logger';
import { ConsoleSink } from '@/core/logging/console-sink';
import { RemoteSink } from '@/core/logging/remote-sink';
import { getAppConfig } from '@/core/config/app-config';

let cached: AppLogger | undefined;

/**
 * Builds the app-wide logger from config: console sink always on, remote
 * sink only when `REMOTE_LOG_URL` is set AND we're running server-side
 * (`typeof window === 'undefined'`) — the remote sink must never ship to
 * the client bundle or run in the browser.
 */
export function getAppLogger(): AppLogger {
  if (cached) return cached;
  const config = getAppConfig();
  const sinks: LogSink[] = [new ConsoleSink()];

  if (typeof window === 'undefined' && config.remoteLogUrl) {
    sinks.push(new RemoteSink(config.remoteLogUrl, config.remoteLogBearerToken));
  }

  cached = new AppLogger(config.logLevel, sinks);
  return cached;
}
