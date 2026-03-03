import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  try {
    const url = new URL(databaseUrl)

    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      url.searchParams.set('connection_limit', '5')
    } else {
      url.searchParams.set('connection_limit', '3')
    }

    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30');
    }

    if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
    }

    return new PrismaClient({
      datasourceUrl: url.toString(),
    })
  } catch (e) {
    return new PrismaClient({
        datasourceUrl: databaseUrl,
    })
  }
}

export const prisma = globalForPrisma.prisma || makePrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
