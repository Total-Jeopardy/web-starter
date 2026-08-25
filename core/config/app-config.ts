import { z } from 'zod';

/**
 * All environment configuration is read once, here, and zod-validated at
 * boot. Nothing else in the app should reach for `process.env` directly —
 * that keeps every env var documented in one place (`.env.example`) and
 * fails fast with a clear error instead of failing deep inside a component.
 */
const appConfigSchema = z.object({
  apiBaseUrl: z.string().url(),
  env: z.enum(['dev', 'staging', 'production']),
  appPreset: z.enum(['no_auth', 'backend_auth_sample']),
  authProvider: z.enum(['none', 'reference_backend', 'custom_backend']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  requestIdHeader: z.string().min(1),
  wsUrl: z.string().optional(),
  remoteLogUrl: z.string().optional(),
  remoteLogBearerToken: z.string().optional(),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

function readEnv(): AppConfig {
  const raw = {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
    env: process.env.NEXT_PUBLIC_ENV ?? 'dev',
    appPreset: process.env.NEXT_PUBLIC_APP_PRESET ?? 'no_auth',
    authProvider: process.env.NEXT_PUBLIC_AUTH_PROVIDER ?? 'none',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL ?? 'info',
    requestIdHeader: process.env.NEXT_PUBLIC_REQUEST_ID_HEADER ?? 'X-Request-Id',
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || undefined,
    // Server-only values. Never reference these from a Client Component —
    // Next.js only inlines NEXT_PUBLIC_-prefixed vars into the client bundle,
    // so these stay undefined there, but keep the boundary intentional.
    remoteLogUrl: process.env.REMOTE_LOG_URL || undefined,
    remoteLogBearerToken: process.env.REMOTE_LOG_BEARER_TOKEN || undefined,
  };

  const parsed = appConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(
      `Invalid app configuration. Check your .env.local against .env.example:\n${issues}`,
    );
  }
  return parsed.data;
}

let cached: AppConfig | undefined;

/** Lazily parsed and memoized so a missing var fails fast on first access, not eagerly at import time in every runtime (edge/node/browser). */
export function getAppConfig(): AppConfig {
  if (!cached) {
    cached = readEnv();
  }
  return cached;
}
