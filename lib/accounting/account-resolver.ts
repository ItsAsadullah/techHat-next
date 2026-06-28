import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ACCOUNT_CODES } from './constants';

const accountCache = new Map<string, { id: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Resolves an account code to its database ID.
 * Uses a simple in-memory cache to avoid repeated DB lookups during a transaction.
 */
export async function resolveAccount(code: string, client: PrismaClient | Prisma.TransactionClient = prisma): Promise<string> {
  const cached = accountCache.get(code);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.id;
  }

  const account = await (client as any).chartOfAccount.findUnique({
    where: { code }
  });

  if (!account) {
    throw new Error(`Account not found for code: ${code}`);
  }

  accountCache.set(code, { id: account.id, timestamp: Date.now() });
  return account.id;
}

/**
 * Resolves multiple account codes in one go.
 */
export async function resolveAccounts(codes: string[], client: PrismaClient | Prisma.TransactionClient = prisma): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const missingCodes: string[] = [];

  for (const code of codes) {
    const cached = accountCache.get(code);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      result.set(code, cached.id);
    } else {
      missingCodes.push(code);
    }
  }

  if (missingCodes.length > 0) {
    const accounts = await (client as any).chartOfAccount.findMany({
      where: { code: { in: missingCodes } }
    });

    for (const acc of accounts) {
      accountCache.set(acc.code, { id: acc.id, timestamp: Date.now() });
      result.set(acc.code, acc.id);
    }

    // Verify all requested codes were found
    for (const code of missingCodes) {
      if (!result.has(code)) {
        throw new Error(`Account not found for code: ${code}`);
      }
    }
  }

  return result;
}
