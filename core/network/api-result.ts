/**
 * Result<T, E> — the web analogue of the Flutter template's `ApiResult<T>`.
 *
 * Repositories and use-cases return this instead of throwing. Nothing above
 * the `core/network/api-client.ts` boundary should ever need a try/catch to
 * handle an expected failure — only truly exceptional, unexpected errors are
 * allowed to throw.
 */
export type Result<T, E = ApiError> = { ok: true; value: T } | { ok: false; error: E };

export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

export function ok<T, E = ApiError>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<T, E = ApiError>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

/**
 * Unwraps a successful result or maps the error through `onError`. Useful at
 * the hook layer when you need a thrown error to hand to TanStack Query
 * (which models failure via rejected promises, not `Result`).
 */
export function unwrapOrThrow<T, E>(result: Result<T, E>, onError?: (error: E) => Error): T {
  if (result.ok) return result.value;
  throw onError ? onError(result.error) : new Error(String((result.error as { message?: string })?.message ?? 'Request failed'));
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? ok(fn(result.value)) : result;
}
