import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  
  try {
    const url = new URL(databaseUrl)
    
    // For Vercel Serverless + Supabase Transaction Pooler (port 6543)
    // We must use pgbouncer=true and a connection_limit of 1 per lambda instance
    if (url.port === '6543') {
      url.searchParams.set('pgbouncer', 'true')
      
      // In production (serverless), limit to 1 connection per instance
      // In development, we can allow a few more since it's a long-running process
      if (process.env.NODE_ENV === 'production') {
        url.searchParams.set('connection_limit', '1')
      } else {
        url.searchParams.set('connection_limit', '5')
      }
    } else {
      // If not using the pooler, still keep limits reasonable
      if (process.env.NODE_ENV === 'production') {
        url.searchParams.set('connection_limit', '5')
      }
    }

    // Set pool timeout to 30s to prevent hanging
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '30')
    }

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
