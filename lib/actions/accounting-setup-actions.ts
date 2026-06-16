'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const STANDARD_SYSTEM_ACCOUNTS = [
  // ASSETS
  { code: '1000', name: 'Cash in Hand', type: 'ASSET', isSystem: true },
  { code: '1010', name: 'Bank Accounts', type: 'ASSET', isSystem: true },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', isSystem: true },
  { code: '1200', name: 'Inventory Asset', type: 'ASSET', isSystem: true },
  { code: '1300', name: 'Advance to Suppliers', type: 'ASSET', isSystem: true },
  
  // LIABILITIES
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isSystem: true },
  { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY', isSystem: true },
  { code: '2200', name: 'Advance from Customers', type: 'LIABILITY', isSystem: true },

  // EQUITY
  { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', isSystem: true },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY', isSystem: true },

  // REVENUE
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', isSystem: true },
  { code: '4100', name: 'Discount Given', type: 'REVENUE', isSystem: true },
  { code: '4200', name: 'Shipping Income', type: 'REVENUE', isSystem: true },

  // EXPENSE
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', isSystem: true },
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', isSystem: true },
  { code: '6100', name: 'Payroll Expense', type: 'EXPENSE', isSystem: true },
  { code: '6200', name: 'Rent Expense', type: 'EXPENSE', isSystem: true },
  { code: '6300', name: 'Bank Fees & Charges', type: 'EXPENSE', isSystem: true },
];

export async function initializeSystemAccounts() {
  try {
    let createdCount = 0;
    
    // We must execute these one by one or via createMany
    // We'll use upsert to be safe.
    for (const acc of STANDARD_SYSTEM_ACCOUNTS) {
      const existing = await prisma.chartOfAccount.findUnique({
        where: { code: acc.code }
      });
      
      if (!existing) {
        await prisma.chartOfAccount.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as any,
            isSystem: acc.isSystem,
            balance: 0,
          }
        });
        createdCount++;
      }
    }
    
    revalidatePath('/admin/accounting/chart-of-accounts');
    return { success: true, message: `Initialized ${createdCount} system accounts.` };
  } catch (error: any) {
    console.error('Failed to initialize accounts:', error);
    return { success: false, error: error.message };
  }
}
