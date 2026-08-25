/**
 * Generic error-envelope parser.
 *
 * Deliberately NOT hardcoded to RFC 7807 (`type`/`title`/`status`/`detail`)
 * or to any one backend's exact contract — field names are configurable so
 * a project can point this at whatever shape its real backend returns
 * without forking the core. See
 * docs/planning/template_genericization_decisions.md for the reasoning.
 */
export interface ErrorEnvelopeFieldMap {
  /** Field names (checked in order) that may hold the human-readable message. */
  messageFields: string[];
  /** Field names that may hold a machine-readable error code. */
  codeFields: string[];
  /** Field names that may hold an HTTP-style status. */
  statusFields: string[];
}

export const defaultErrorEnvelopeFieldMap: ErrorEnvelopeFieldMap = {
  messageFields: ['message', 'error', 'detail', 'title'],
  codeFields: ['code', 'error_code', 'errorCode'],
  statusFields: ['status', 'statusCode', 'status_code'],
};

export interface ParsedErrorEnvelope {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * Attempts to pull a human-readable message, code, and status out of an
 * arbitrary JSON error body using the configured field map. Falls back to a
 * generic message when nothing matches, and never throws.
 */
export function parseErrorEnvelope(
  body: unknown,
  fieldMap: ErrorEnvelopeFieldMap = defaultErrorEnvelopeFieldMap,
  fallbackMessage = 'Request failed',
): ParsedErrorEnvelope {
  if (body == null || typeof body !== 'object') {
    if (typeof body === 'string' && body.length > 0) {
      return { message: body };
    }
    return { message: fallbackMessage };
  }

  const record = body as Record<string, unknown>;

  const message = firstStringOrListItem(record, fieldMap.messageFields) ?? fallbackMessage;
  const code = firstString(record, fieldMap.codeFields);
  const statusRaw = firstDefined(record, fieldMap.statusFields);
  const statusCode = typeof statusRaw === 'number' ? statusRaw : undefined;

  return {
    message,
    ...(code !== undefined ? { code } : {}),
    ...(statusCode !== undefined ? { statusCode } : {}),
  };
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function firstString(record: Record<string, unknown>, keys: string[]): string | undefined {
  const value = firstDefined(record, keys);
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function firstStringOrListItem(record: Record<string, unknown>, keys: string[]): string | undefined {
  const value = firstDefined(record, keys);
  if (typeof value === 'string' && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
    return value[0] as string;
  }
  return undefined;
}
