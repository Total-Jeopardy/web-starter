import { NextResponse } from 'next/server';

/**
 * The only route handler in the template core — Next.js here is
 * frontend + BFF-lite, not a backend host. Don't add more route handlers
 * to the core; project-specific API routes belong at the project layer.
 */
export function GET() {
  return NextResponse.json({ status: 'ok' });
}
