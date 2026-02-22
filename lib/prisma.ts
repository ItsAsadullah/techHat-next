import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  
  try {
    const url = new URL(databaseUrl)
    
    // Set connection limit to reasonable value for dev/prod to avoid timeout
     // Default is num_cpus * 2 + 1, but explicitly setting it helps with serverless/dev
     const currentLimit = url.searchParams.get('connection_limit');
     if (!currentLimit || parseInt(currentLimit) < 5) {
         if (process.env.NODE_ENV !== 'production') {
             console.log(`Prisma: Overriding connection limit from ${currentLimit || 'default'} to 20 to prevent timeouts`);
         }
         url.searchParams.set('connection_limit', '20') 
     }

     // Set pool timeout to 30s
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30')
    }

    // Supabase transaction pooler requires pgbouncer mode sometimes, 
    // but usually only if using port 6543. 
    // We'll trust the connection string mostly but ensure limit is not 1.

    return new PrismaClient({
      datasourceUrl: url.toString(),
    })
  } catch (e) {
    // Fallback if URL parsing fails
    return new PrismaClient({
        datasourceUrl: databaseUrl,
    })
  }
}

export const prisma = globalForPrisma.prisma || makePrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
