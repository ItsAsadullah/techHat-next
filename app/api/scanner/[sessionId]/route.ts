import { NextRequest, NextResponse } from 'next/server';
import { createSession, getSession, pushScan, setConnected, addController, removeController } from '@/lib/scanner-store';

/**
 * GET /api/scanner/[sessionId] → SSE stream for desktop to listen
 * POST /api/scanner/[sessionId] → Mobile sends scanned barcode
 */

// GET: Desktop subscribes to SSE stream
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  // Create session if it doesn't exist
  let session = getSession(sessionId);
  if (!session) {
    session = createSession(sessionId);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller as an SSE listener (fan-out: multiple clients supported)
      addController(sessionId, controller);

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', sessionId, timestamp: Date.now() })}\n\n`)
      );
      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeController(sessionId, controller);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// POST: Mobile sends scanned barcode data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const body = await request.json();
  const { code, action } = body;

  // Handle mobile connect/disconnect
  if (action === 'connect') {
    // Reject if admin has not explicitly turned the scanner switch ON
    if (!session.adminActive) {
      return NextResponse.json(
        { error: 'no_admin', message: 'Admin panel scanner switch is OFF.' },
        { status: 403 }
      );
    }
    setConnected(sessionId, true);
    return NextResponse.json({ success: true, message: 'Connected' });
  }

  if (action === 'disconnect') {
    setConnected(sessionId, false);
    return NextResponse.json({ success: true, message: 'Disconnected' });
  }

  // Handle scan
  if (!code) {
    return NextResponse.json({ error: 'No barcode provided' }, { status: 400 });
  }

  const pushed = pushScan(sessionId, code);

  return NextResponse.json({
    success: true,
    delivered: pushed,
    message: pushed ? 'Scan delivered to desktop' : 'Scan stored but desktop not connected',
  });
}
