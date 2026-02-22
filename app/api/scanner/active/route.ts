import { NextResponse } from 'next/server';
import { getLatestAdminActiveSessionId } from '@/lib/scanner-store';

/**
 * GET /api/scanner/active
 * Returns the session where admin explicitly turned the scanner switch ON.
 * Returns 404 if no such session exists (switch is OFF or was never started).
 */
export async function GET() {
  const sessionId = getLatestAdminActiveSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: 'No active session found' }, { status: 404 });
  }
  return NextResponse.json({ sessionId });
}
