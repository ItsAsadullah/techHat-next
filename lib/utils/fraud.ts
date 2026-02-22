import { prisma } from '@/lib/prisma';

const db = prisma as any;

interface RateLimitOptions {
  windowMinutes?: number; // sliding window in minutes
  maxRequests?: number;   // max requests per window
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
}

/**
 * IP-based rate limiter stored in the ip_rate_limits table.
 * Gracefully allows requests if the table doesn't exist yet.
 */
export async function checkIpRateLimit(
  ip: string,
  action: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const { windowMinutes = 60, maxRequests = 10 } = options;

  try {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const now = new Date();

    // Upsert rate limit record
    const result: any = await db.$queryRaw`
      INSERT INTO ip_rate_limits (ip_address, action, count, window_start, updated_at)
      VALUES (${ip}, ${action}, 1, ${now}, ${now})
      ON CONFLICT (ip_address, action) DO UPDATE
        SET count = CASE
              WHEN ip_rate_limits.window_start < ${cutoff} THEN 1
              ELSE ip_rate_limits.count + 1
            END,
            window_start = CASE
              WHEN ip_rate_limits.window_start < ${cutoff} THEN ${now}
              ELSE ip_rate_limits.window_start
            END,
            updated_at = ${now}
      RETURNING count, window_start, blocked_until
    `;

    const record = Array.isArray(result) ? result[0] : null;
    if (!record) return { allowed: true, remaining: maxRequests - 1 };

    // Check if explicitly blocked
    if (record.blocked_until && new Date(record.blocked_until) > now) {
      return { allowed: false, remaining: 0, resetAt: new Date(record.blocked_until) };
    }

    const count = Number(record.count);
    if (count > maxRequests) {
      // Block for 1 hour on abuse
      const blockedUntil = new Date(Date.now() + 60 * 60 * 1000);
      await db.$executeRaw`
        UPDATE ip_rate_limits
        SET blocked_until = ${blockedUntil}
        WHERE ip_address = ${ip} AND action = ${action}
      `;
      return { allowed: false, remaining: 0, resetAt: blockedUntil };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - count),
      resetAt: new Date(new Date(record.window_start).getTime() + windowMinutes * 60 * 1000),
    };
  } catch {
    // If table doesn't exist, allow all requests (graceful degradation)
    return { allowed: true, remaining: maxRequests };
  }
}

/**
 * Detect suspicious order patterns (velocity, duplicate phone/email in short time).
 */
export async function detectOrderFraud(params: {
  ip: string;
  phone: string;
  email?: string;
}): Promise<{ isSuspicious: boolean; reason?: string }> {
  try {
    const window = new Date(Date.now() - 30 * 60 * 1000); // 30 min window

    // Check for multiple orders from same phone
    const phoneCount: any[] = await db.$queryRaw`
      SELECT COUNT(*) as cnt FROM orders
      WHERE customer_phone LIKE ${'%' + params.phone.slice(-10)}
        AND created_at > ${window}
        AND is_pos = false
    `;

    if (parseInt(phoneCount[0]?.cnt ?? '0') >= 3) {
      return { isSuspicious: true, reason: 'Multiple orders from same phone within 30 minutes' };
    }

    // Check email too
    if (params.email) {
      const emailCount: any[] = await db.$queryRaw`
        SELECT COUNT(*) as cnt FROM orders
        WHERE customer_email = ${params.email}
          AND created_at > ${window}
          AND is_pos = false
      `;
      if (parseInt(emailCount[0]?.cnt ?? '0') >= 3) {
        return { isSuspicious: true, reason: 'Multiple orders from same email within 30 minutes' };
      }
    }

    return { isSuspicious: false };
  } catch {
    return { isSuspicious: false };
  }
}
