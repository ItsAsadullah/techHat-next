/**
 * In-memory store for scanner sessions.
 * Each session connects a desktop browser with a mobile scanner.
 *
 * Supports multiple SSE listeners per session (fan-out) so that
 * both the /scanner page and the admin panel can receive events.
 */

export interface ScannerSession {
  id: string;
  createdAt: number;
  connected: boolean;                                    // mobile has connected
  adminActive: boolean;                                  // admin explicitly turned switch ON
  controllers: ReadableStreamDefaultController[];        // multiple SSE listeners (fan-out)
  scannedCodes: string[];                                // history of scanned codes
  deliveredCount: number;                                // codes delivered to at least one listener
}

// In-memory store — stored on globalThis so it survives Next.js hot-module reloads
// in development. Without this, every file-save would reset the sessions Map and
// lose adminActive=true, making the mobile think the switch is OFF.
declare global {
  // eslint-disable-next-line no-var
  var __scannerSessions: Map<string, ScannerSession> | undefined;
}

const sessions: Map<string, ScannerSession> =
  globalThis.__scannerSessions ?? (globalThis.__scannerSessions = new Map());

// Auto-cleanup sessions older than 12 hours
const SESSION_TTL = 12 * 60 * 60 * 1000;

function cleanup() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      sessions.delete(id);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 5 * 60 * 1000);
}

export function createSession(id: string): ScannerSession {
  const session: ScannerSession = {
    id,
    createdAt: Date.now(),
    connected: false,
    adminActive: false,
    controllers: [],
    scannedCodes: [],
    deliveredCount: 0,
  };
  sessions.set(id, session);
  return session;
}

export function getSession(id: string): ScannerSession | undefined {
  return sessions.get(id);
}

export function deleteSession(id: string): void {
  sessions.delete(id);
}

/** Add an SSE controller to this session (fan-out: multiple desktop listeners). */
export function addController(
  sessionId: string,
  controller: ReadableStreamDefaultController
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.controllers.push(controller);
}

/** Remove an SSE controller when the client disconnects. */
export function removeController(
  sessionId: string,
  controller: ReadableStreamDefaultController
): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.controllers = session.controllers.filter((c) => c !== controller);
}

/** Push a scan to ALL active SSE listeners. */
export function pushScan(sessionId: string, code: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;

  session.scannedCodes.push(code);

  const payload = `data: ${JSON.stringify({ type: 'scan', code, timestamp: Date.now() })}\n\n`;
  let delivered = false;
  const dead: ReadableStreamDefaultController[] = [];

  for (const ctrl of session.controllers) {
    try {
      ctrl.enqueue(payload);
      delivered = true;
    } catch {
      dead.push(ctrl);
    }
  }

  // Prune closed controllers
  if (dead.length) {
    session.controllers = session.controllers.filter((c) => !dead.includes(c));
  }

  if (delivered) session.deliveredCount = session.scannedCodes.length;
  return delivered;
}

/** Get the most recently created session where admin explicitly enabled the switch. */
export function getLatestAdminActiveSessionId(): string | null {
  let latest: ScannerSession | null = null;
  for (const session of sessions.values()) {
    if (!session.adminActive) continue;
    if (!latest || session.createdAt > latest.createdAt) {
      latest = session;
    }
  }
  return latest?.id ?? null;
}

/** Mark a session as admin-active (switch ON) or inactive (switch OFF). */
export function setAdminActive(sessionId: string, active: boolean): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.adminActive = active;
    if (active) {
      // Fresh start: clear old scan history so stale codes don't replay
      session.scannedCodes = [];
      session.deliveredCount = 0;
      session.connected = false;
    } else {
      // Also clear mobile-connected state when admin turns off
      session.connected = false;
    }
  }
}

/** Notify all SSE listeners of mobile connect/disconnect status. */
export function setConnected(sessionId: string, connected: boolean): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  session.connected = connected;

  const payload = `data: ${JSON.stringify({ type: 'status', connected, timestamp: Date.now() })}\n\n`;
  const dead: ReadableStreamDefaultController[] = [];

  for (const ctrl of session.controllers) {
    try {
      ctrl.enqueue(payload);
    } catch {
      dead.push(ctrl);
    }
  }

  if (dead.length) {
    session.controllers = session.controllers.filter((c) => !dead.includes(c));
  }
}
