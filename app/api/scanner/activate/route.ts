import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession, setAdminActive } from '@/lib/scanner-store';

/**
 * POST /api/scanner/activate   — admin switch turned ON
 * DELETE /api/scanner/activate — admin switch turned OFF
 */

export async function POST(request: NextRequest) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  // Create session if it doesn't exist yet (SSE may not have connected yet)
  if (!getSession(sessionId)) {
    createSession(sessionId);
  }

  setAdminActive(sessionId, true);
  return NextResponse.json({ success: true, sessionId });
}

export async function DELETE(request: NextRequest) {
  const { sessionId } = await request.json();
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
  }

  setAdminActive(sessionId, false);
  return NextResponse.json({ success: true });
}
