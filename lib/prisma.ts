import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''

  try {
    const url = new URL(databaseUrl)

    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      url.searchParams.set('connection_limit', '20')  // Increased from 5 for better concurrency
    } else {
      url.searchParams.set('connection_limit', '15')  // Increased from 3 for dev testing
    }

    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '20');  // Reduced from 30 for faster timeout
    }

    if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
    }

    const client = new PrismaClient({
      datasourceUrl: url.toString(),
    })

    // Add query logging extension for performance debugging
    if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_QUERY_LOGGING) {
      return client.$extends({
        query: {
          async $allOperations({ operation, model, args, query }) {
            const start = performance.now();
            const result = await query(args);
            const duration = performance.now() - start;
            
            // Log slow queries (>100ms)
            if (duration > 100) {
              console.log(
                `[SLOW_QUERY] ${model}.${operation} took ${duration.toFixed(2)}ms`
              );
              if (typeof args === 'object' && args !== null) {
                console.log(`  where: ${JSON.stringify(args).substring(0, 100)}`);
              }
            }
            
            return result;
          },
        },
      });
    }

    return client
  } catch (e) {
    return new PrismaClient({
        datasourceUrl: databaseUrl,
    })
  }
}

export const prisma = globalForPrisma.prisma || makePrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
