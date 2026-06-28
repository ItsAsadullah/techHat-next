'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { NEW_SYSTEM_ACCOUNTS, PARTNER_CONFIG, INVESTOR_CONFIG, OPENING_BALANCES } from '@/lib/accounting/constants';

const STANDARD_SYSTEM_ACCOUNTS = [
  // ASSETS
  { code: '1000', name: 'Cash in Hand', type: 'ASSET', isSystem: true, description: 'Physical cash' },
  { code: '1010', name: 'Bank Accounts', type: 'ASSET', isSystem: true, description: 'Bank balances' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', isSystem: true, description: 'Customer dues' },
  { code: '1200', name: 'Inventory Asset', type: 'ASSET', isSystem: true, description: 'Stock value' },
  { code: '1300', name: 'Advance to Suppliers', type: 'ASSET', isSystem: true, description: 'Prepaid to suppliers' },
  
  // LIABILITIES
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isSystem: true, description: 'Supplier dues' },
  { code: '2100', name: 'Sales Tax Payable', type: 'LIABILITY', isSystem: true, description: 'VAT/Tax payable' },
  { code: '2200', name: 'Advance from Customers', type: 'LIABILITY', isSystem: true, description: 'Customer advance' },

  // EQUITY
  { code: '3000', name: 'Owner\'s Equity', type: 'EQUITY', isSystem: true, description: 'Base equity' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY', isSystem: true, description: 'Undistributed profit' },

  // REVENUE
  { code: '4000', name: 'Sales Revenue', type: 'REVENUE', isSystem: true, description: 'Product sales' },
  { code: '4100', name: 'Discount Given', type: 'REVENUE', isSystem: true, description: 'Sales discounts' },
  { code: '4200', name: 'Shipping Income', type: 'REVENUE', isSystem: true, description: 'Delivery charges' },

  // EXPENSE
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', isSystem: true, description: 'Cost of products sold' },
  { code: '6000', name: 'Operating Expenses', type: 'EXPENSE', isSystem: true, description: 'General operating expenses' },
  { code: '6100', name: 'Payroll Expense', type: 'EXPENSE', isSystem: true, description: 'Salaries and wages' },
  { code: '6200', name: 'Rent Expense', type: 'EXPENSE', isSystem: true, description: 'Office/shop rent' },
  { code: '6300', name: 'Bank Fees & Charges', type: 'EXPENSE', isSystem: true, description: 'Bank charges' },
];

export async function initializeSystemAccounts() {
  try {
    let createdCount = 0;
    const allAccounts = [...STANDARD_SYSTEM_ACCOUNTS, ...NEW_SYSTEM_ACCOUNTS];
    
    for (const acc of allAccounts) {
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
            description: acc.description,
            balance: 0,
          }
        });
        createdCount++;
      } else {
        // Update description if missing
        if (!existing.description && acc.description) {
          await prisma.chartOfAccount.update({
            where: { id: existing.id },
            data: { description: acc.description }
          });
        }
      }
    }
    
    revalidatePath('/admin/accounting/chart-of-accounts');
    return { success: true, message: `Initialized ${createdCount} system accounts.` };
  } catch (error: any) {
    console.error('Failed to initialize accounts:', error);
    return { success: false, error: error.message };
  }
}

export async function seedPartnersAndDeposits() {
  try {
    // 1. Check/Create Partners
    const partnerA = await prisma.partner.findFirst({ where: { name: PARTNER_CONFIG.PARTNER_A.name } }) ||
      await prisma.partner.create({
        data: {
          name: PARTNER_CONFIG.PARTNER_A.name,
          capitalRatio: PARTNER_CONFIG.PARTNER_A.ratio,
        }
      });

    const partnerB = await prisma.partner.findFirst({ where: { name: PARTNER_CONFIG.PARTNER_B.name } }) ||
      await prisma.partner.create({
        data: {
          name: PARTNER_CONFIG.PARTNER_B.name,
          capitalRatio: PARTNER_CONFIG.PARTNER_B.ratio,
        }
      });

    // 2. Check/Create Investor
    const investor = await prisma.investorLoan.findFirst({ where: { investorName: INVESTOR_CONFIG.name } }) ||
      await prisma.investorLoan.create({
        data: {
          investorName: INVESTOR_CONFIG.name,
          loanAmount: 0, // Set initial 0, update if there is a specific amount
          disbursedDate: new Date(),
        }
      });

    // 3. Opening Balances (Security Deposit)
    // Create manual journal entry if deposit not recorded
    const depositAccount = await prisma.chartOfAccount.findUnique({ where: { code: '1400' } });
    const partnerAAccount = await prisma.chartOfAccount.findUnique({ where: { code: '3200' } });
    const partnerBAccount = await prisma.chartOfAccount.findUnique({ where: { code: '3300' } });

    if (depositAccount && partnerAAccount && partnerBAccount) {
      const existingEntry = await prisma.journalEntry.findFirst({
        where: { reference: 'INITIAL_SECURITY_DEPOSIT' }
      });

      if (!existingEntry) {
        await prisma.$transaction(async (tx) => {
          const je = await tx.journalEntry.create({
            data: {
              entryNumber: 'JE-OPENING-001',
              reference: 'INITIAL_SECURITY_DEPOSIT',
              note: 'Opening balance for Rent Security Deposit contributed by partners',
              source: 'OPENING_BALANCE',
              isAutoGenerated: true,
              journalEntryItems: {
                create: [
                  { accountId: depositAccount.id, debit: OPENING_BALANCES.SECURITY_DEPOSIT * 2, credit: 0 },
                  { accountId: partnerAAccount.id, debit: 0, credit: OPENING_BALANCES.SECURITY_DEPOSIT },
                  { accountId: partnerBAccount.id, debit: 0, credit: OPENING_BALANCES.SECURITY_DEPOSIT },
                ]
              }
            }
          });

          // Update Account Balances
          await tx.chartOfAccount.update({ where: { id: depositAccount.id }, data: { balance: { increment: OPENING_BALANCES.SECURITY_DEPOSIT * 2 } } });
          await tx.chartOfAccount.update({ where: { id: partnerAAccount.id }, data: { balance: { increment: OPENING_BALANCES.SECURITY_DEPOSIT } } });
          await tx.chartOfAccount.update({ where: { id: partnerBAccount.id }, data: { balance: { increment: OPENING_BALANCES.SECURITY_DEPOSIT } } });

          // Record in Partner Capital Accounts
          await tx.capitalAccount.createMany({
            data: [
              { partnerId: partnerA.id, type: 'CONTRIBUTION', amount: OPENING_BALANCES.SECURITY_DEPOSIT, description: 'Initial Security Deposit Contribution' },
              { partnerId: partnerB.id, type: 'CONTRIBUTION', amount: OPENING_BALANCES.SECURITY_DEPOSIT, description: 'Initial Security Deposit Contribution' }
            ]
          });
          
          await tx.partner.update({ where: { id: partnerA.id }, data: { totalContributed: { increment: OPENING_BALANCES.SECURITY_DEPOSIT } } });
          await tx.partner.update({ where: { id: partnerB.id }, data: { totalContributed: { increment: OPENING_BALANCES.SECURITY_DEPOSIT } } });
        });
      }
    }

    return { success: true, message: 'Partners and Opening balances seeded successfully.' };
  } catch (error: any) {
    console.error('Failed to seed partners/deposits:', error);
    return { success: false, error: error.message };
  }
}
