'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function processWalletTransaction({
  userId,
  amount,
  type,
  referenceId,
  note,
}: {
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  referenceId?: string;
  note?: string;
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      });

      if (!user) throw new Error('User not found');

      if (type === 'DEBIT' && user.walletBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = type === 'CREDIT' 
        ? user.walletBalance + amount 
        : user.walletBalance - amount;

      // 1. Create Transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type,
          referenceId,
          note,
        },
      });

      // 2. Update User Balance
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      });

      return { success: true, transaction, balance: newBalance };
    });
  } catch (error: any) {
    console.error('Wallet transaction error:', error);
    return { success: false, error: error.message || 'Failed to process wallet transaction' };
  }
}

export async function getWalletBalance(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });
    return user?.walletBalance || 0;
  } catch (error) {
    return 0;
  }
}

export async function getWalletHistory(userId: string) {
  try {
    return await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    return [];
  }
}
