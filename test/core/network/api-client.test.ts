import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// getAppConfig() is zod-validated and memoized at module scope, so the env
// vars it reads must be set before the first call — before importing
// ApiClient and before any test constructs one.
process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.test';
process.env.NEXT_PUBLIC_ENV = 'dev';
process.env.NEXT_PUBLIC_REQUEST_ID_HEADER = 'X-Request-Id';

import { ApiClient } from '@/core/network/api-client';
import type { TokenStorage } from '@/core/auth/token-storage-provider';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

describe('ApiClient', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('returns ok:true with the parsed body on a 2xx JSON response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ hello: 'world' }));

    const client = new ApiClient();
    const result = await client.get<{ hello: string }>('/ping');

    expect(result).toEqual({ ok: true, value: { hello: 'world' } });
  });

  it('returns ok:false with a parsed ApiError on a non-2xx response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      jsonResponse({ message: 'Invalid credentials', code: 'auth_failed' }, { status: 401, statusText: 'Unauthorized' }),
    );

    const client = new ApiClient();
    const result = await client.post('/auth/login', { phone: '0', password: '0' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Invalid credentials');
      expect(result.error.code).toBe('auth_failed');
      expect(result.error.statusCode).toBe(401);
    }
  });

  it('returns ok:false with a network error when fetch rejects', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to fetch'));

    const client = new ApiClient();
    const result = await client.get('/ping');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Failed to fetch');
    }
  });

  it('treats a 204 No Content response as ok:true with an undefined value', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(new Response(null, { status: 204 }));

    const client = new ApiClient();
    const result = await client.delete('/sessions/1');

    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('injects a correlation id header on every request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));

    const client = new ApiClient();
    await client.get('/ping');

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('X-Request-Id')).toBeTruthy();
  });

  it('generates a fresh correlation id per request', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));

    const client = new ApiClient();
    await client.get('/ping');
    await client.get('/ping');

    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
    const [, firstInit] = calls[0]!;
    const [, secondInit] = calls[1]!;
    const firstId = (firstInit.headers as Headers).get('X-Request-Id');
    const secondId = (secondInit.headers as Headers).get('X-Request-Id');
    expect(firstId).not.toBe(secondId);
  });

  it('attaches a bearer token from tokenStorage when configured', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({}));

    const tokenStorage: TokenStorage = {
      getAccessToken: vi.fn().mockResolvedValue('secret-token'),
      getRefreshToken: vi.fn().mockResolvedValue(null),
      saveTokens: vi.fn(),
      clearTokens: vi.fn(),
    };

    const client = new ApiClient({ tokenStorage });
    await client.get('/me');

    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
  });

  it('invokes onUnauthorized when the response is a 401', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(jsonResponse({ message: 'nope' }, { status: 401 }));

    const onUnauthorized = vi.fn();
    const client = new ApiClient({ onUnauthorized });
    await client.get('/me');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
