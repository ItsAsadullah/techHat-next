import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  
  try {
    const url = new URL(databaseUrl)
    
    // Vercel Serverless + Supabase Pooler এর জন্য connection_limit অবশ্যই 1 হতে হবে
    url.searchParams.set('connection_limit', '1')
    
    // Timeout একটু কমিয়ে দেওয়া হলো যাতে রিকোয়েস্ট হ্যাং না হয়
    if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '15')
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
