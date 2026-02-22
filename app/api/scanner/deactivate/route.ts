import { NextRequest, NextResponse } from 'next/server';
import { setAdminActive } from '@/lib/scanner-store';

/**
 * POST /api/scanner/deactivate
 * Called via navigator.sendBeacon on page unload to deactivate a session.
 * sendBeacon only supports POST, so we can't reuse the DELETE /activate endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (sessionId) {
      setAdminActive(sessionId, false);
    }
  } catch { /* ignore parse errors */ }
  return NextResponse.json({ success: true });
}
