/**
 * Per-request correlation IDs. Every request the `api-client` sends gets a
 * fresh ID attached under the configurable header name so client logs,
 * server logs, and backend logs can be joined on one value.
 */
export function generateRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (older Node/edge runtimes).
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function withRequestId(headers: HeadersInit | undefined, headerName: string): Headers {
  const merged = new Headers(headers);
  if (!merged.has(headerName)) {
    merged.set(headerName, generateRequestId());
  }
  return merged;
}

export function readRequestId(headers: Headers, headerName: string): string | null {
  return headers.get(headerName);
}
