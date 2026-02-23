import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function makePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL ?? ''
  
  try {
    const url = new URL(databaseUrl)
    
    // Vercel Serverless + Supabase Pooler এর জন্য connection_limit 1 রাখা ভালো
    // তবে বিল্ড টাইমে (production) অনেকগুলো পেজ একসাথে জেনারেট হয়, তাই তখন বেশি কানেকশন দরকার
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
      // NEXT_PHASE না থাকলে মানে এটা রানটাইম (Vercel Serverless)
      url.searchParams.set('connection_limit', '1')
    } else {
      // লোকাল ডেভ সার্ভার বা বিল্ড টাইমে বেশি কানেকশন দরকার হতে পারে
      url.searchParams.set('connection_limit', '5')
    }
    
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
