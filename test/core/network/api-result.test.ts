import { describe, expect, it } from 'vitest';
import { err, isErr, isOk, mapResult, ok, unwrapOrThrow, type Result } from '@/core/network/api-result';

describe('api-result', () => {
  it('ok() builds a success result', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
  });

  it('err() builds a failure result', () => {
    const result = err({ message: 'boom' });
    expect(result).toEqual({ ok: false, error: { message: 'boom' } });
  });

  it('isOk() narrows a success result', () => {
    const result: Result<number> = ok(1);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.value).toBe(1);
    }
  });

  it('isOk() is false for a failure result', () => {
    const result: Result<number> = err({ message: 'nope' });
    expect(isOk(result)).toBe(false);
  });

  it('isErr() narrows a failure result', () => {
    const result: Result<number> = err({ message: 'nope' });
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error.message).toBe('nope');
    }
  });

  it('isErr() is false for a success result', () => {
    const result: Result<number> = ok(1);
    expect(isErr(result)).toBe(false);
  });

  describe('unwrapOrThrow', () => {
    it('returns the value on success without throwing', () => {
      expect(unwrapOrThrow(ok('value'))).toBe('value');
    });

    it('throws a generic Error using the error message on failure', () => {
      expect(() => unwrapOrThrow(err({ message: 'request failed' }))).toThrow('request failed');
    });

    it('falls back to a default message when the error has none', () => {
      expect(() => unwrapOrThrow(err({} as { message?: string }))).toThrow('Request failed');
    });

    it('uses the onError mapper when provided', () => {
      expect(() =>
        unwrapOrThrow(err({ message: 'boom' }), (error) => new Error(`mapped: ${error.message}`)),
      ).toThrow('mapped: boom');
    });
  });

  describe('mapResult', () => {
    it('applies fn to the value on success', () => {
      const result = mapResult(ok(2), (n) => n * 10);
      expect(result).toEqual({ ok: true, value: 20 });
    });

    it('passes the failure through unchanged', () => {
      const failure = err<number, { message: string }>({ message: 'fail' });
      const result = mapResult(failure, (n) => n * 10);
      expect(result).toBe(failure);
    });
  });
});
