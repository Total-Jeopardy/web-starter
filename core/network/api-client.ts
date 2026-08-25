import { getAppConfig } from '@/core/config/app-config';
import { defaultErrorEnvelopeFieldMap, parseErrorEnvelope } from '@/core/network/error-envelope';
import { type ApiError, type Result, err, ok } from '@/core/network/api-result';
import { withRequestId } from '@/core/network/request-correlation';
import type { TokenStorage } from '@/core/auth/token-storage-provider';

export interface ApiClientOptions {
  baseUrl?: string;
  tokenStorage?: TokenStorage | null;
  onUnauthorized?: () => void;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

/**
 * Typed fetch wrapper — the web analogue of the Flutter template's
 * `DioClient`. Owns the base URL, credentials mode, bearer-token injection,
 * and correlation IDs so no feature reaches for raw `fetch` directly.
 *
 * Every method returns `Result<T, ApiError>` — callers never need a
 * try/catch for an expected HTTP failure.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenStorage: TokenStorage | null;
  private readonly onUnauthorized: (() => void) | undefined;

  constructor(options: ApiClientOptions = {}) {
    const config = getAppConfig();
    this.baseUrl = options.baseUrl ?? config.apiBaseUrl;
    this.tokenStorage = options.tokenStorage ?? null;
    this.onUnauthorized = options.onUnauthorized;
  }

  get<T>(path: string, options?: RequestOptions): Promise<Result<T, ApiError>> {
    return this.request<T>('GET', path, undefined, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<Result<T, ApiError>> {
    return this.request<T>('POST', path, body, options);
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<Result<T, ApiError>> {
    return this.request<T>('PUT', path, body, options);
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<Result<T, ApiError>> {
    return this.request<T>('PATCH', path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Promise<Result<T, ApiError>> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  private async request<T>(
    method: string,
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Promise<Result<T, ApiError>> {
    const config = getAppConfig();
    const url = this.buildUrl(path, options?.query);
    const headers = withRequestId(
      { Accept: 'application/json', ...(options?.headers ?? {}) },
      config.requestIdHeader,
    );

    if (body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.tokenStorage) {
      const token = await this.tokenStorage.getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const init: RequestInit = {
        method,
        headers,
        // Cookie-based auth adapters rely on this; bearer-token adapters
        // don't need it but it's harmless to include.
        credentials: 'include',
      };
      if (body !== undefined) init.body = JSON.stringify(body);
      if (options?.signal) init.signal = options.signal;

      const response = await fetch(url, init);

      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      if (!response.ok) {
        return err(await this.toApiError(response));
      }

      if (response.status === 204) {
        return ok(undefined as T);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        return ok((await response.json()) as T);
      }
      return ok((await response.text()) as unknown as T);
    } catch (cause) {
      return err(this.toNetworkError(cause));
    }
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    const url = new URL(path, this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async toApiError(response: Response): Promise<ApiError> {
    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = undefined;
    }
    const envelope = parseErrorEnvelope(parsedBody, defaultErrorEnvelopeFieldMap, response.statusText || 'Request failed');
    return {
      message: envelope.message,
      statusCode: envelope.statusCode ?? response.status,
      ...(envelope.code !== undefined ? { code: envelope.code } : {}),
    };
  }

  private toNetworkError(cause: unknown): ApiError {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      return { message: 'Request was cancelled.' };
    }
    if (cause instanceof Error) {
      return { message: cause.message || 'Network request failed.' };
    }
    return { message: 'Network request failed.' };
  }
}

let sharedClient: ApiClient | undefined;

/** Default client instance for the common case (no auth wiring needed). */
export function getApiClient(): ApiClient {
  if (!sharedClient) {
    sharedClient = new ApiClient();
  }
  return sharedClient;
}
