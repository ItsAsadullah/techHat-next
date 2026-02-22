import { NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

/**
 * Returns the server's LAN IP address so the client can
 * build a scanner URL that mobile devices can access.
 */
export async function GET() {
  const nets = networkInterfaces();
  let lanIp = '';

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Skip internal (127.x.x.x) and non-IPv4
      if (net.family === 'IPv4' && !net.internal) {
        lanIp = net.address;
        break;
      }
    }
    if (lanIp) break;
  }

  return NextResponse.json({ ip: lanIp || 'localhost' });
}
