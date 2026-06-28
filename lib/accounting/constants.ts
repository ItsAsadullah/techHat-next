// ═══════════════════════════════════════════════════
// ACCOUNTING SYSTEM CONSTANTS
// ═══════════════════════════════════════════════════

/**
 * Standard Chart of Account codes.
 * These match what's seeded in accounting-setup-actions.ts.
 * NEVER change these codes without a migration.
 */
export const ACCOUNT_CODES = {
  // ─── ASSETS (1xxx) ───
  CASH_IN_HAND: '1000',
  BANK_ACCOUNTS: '1010',
  ACCOUNTS_RECEIVABLE: '1100',
  INVENTORY_ASSET: '1200',
  ADVANCE_TO_SUPPLIERS: '1300',
  SECURITY_DEPOSITS: '1400',

  // ─── LIABILITIES (2xxx) ───
  ACCOUNTS_PAYABLE: '2000',
  SALES_TAX_PAYABLE: '2100',
  ADVANCE_FROM_CUSTOMERS: '2200',
  INVESTOR_LOAN: '2300',

  // ─── EQUITY (3xxx) ───
  OWNERS_EQUITY: '3000',
  RETAINED_EARNINGS: '3100',
  PARTNER_A_CAPITAL: '3200',
  PARTNER_B_CAPITAL: '3300',
  PROFIT_DISTRIBUTION_PAYABLE: '3400',

  // ─── REVENUE (4xxx) ───
  SALES_REVENUE: '4000',
  DISCOUNT_GIVEN: '4100',
  SHIPPING_INCOME: '4200',
  SERVICE_INCOME: '4300',

  // ─── EXPENSE (5xxx / 6xxx) ───
  COGS: '5000',
  OPERATING_EXPENSES: '6000',
  PAYROLL_EXPENSE: '6100',
  RENT_EXPENSE: '6200',
  BANK_FEES: '6300',
  UTILITIES_EXPENSE: '6400',
  MOBILE_INTERNET: '6500',
  MISCELLANEOUS_EXPENSE: '6600',
} as const;

export type AccountCode = (typeof ACCOUNT_CODES)[keyof typeof ACCOUNT_CODES];

/**
 * New system accounts to be seeded (beyond what's already in accounting-setup-actions.ts)
 */
export const NEW_SYSTEM_ACCOUNTS = [
  { code: '1400', name: 'Security Deposits', type: 'ASSET', isSystem: true, description: 'Rent deposits, utility deposits' },
  { code: '2300', name: 'Investor Loan', type: 'LIABILITY', isSystem: true, description: 'Loans from investors' },
  { code: '3200', name: 'Asadullah Al Galib - Capital', type: 'EQUITY', isSystem: true, description: 'Partner A equity' },
  { code: '3300', name: 'Bokhtiar Raman - Capital', type: 'EQUITY', isSystem: true, description: 'Partner B equity' },
  { code: '3400', name: 'Profit Distribution Payable', type: 'EQUITY', isSystem: true, description: 'Pending profit distributions' },
  { code: '4300', name: 'Service Income', type: 'REVENUE', isSystem: true, description: 'Non-product service revenue' },
  { code: '6400', name: 'Utilities Expense', type: 'EXPENSE', isSystem: true, description: 'Electricity, water, gas' },
  { code: '6500', name: 'Mobile & Internet', type: 'EXPENSE', isSystem: true, description: 'Phone bills, internet' },
  { code: '6600', name: 'Miscellaneous Expense', type: 'EXPENSE', isSystem: true, description: 'Other expenses' },
];

/**
 * Partner configuration (hardcoded from business requirements)
 */
export const PARTNER_CONFIG = {
  PARTNER_A: {
    name: 'Asadullah Al Galib',
    ratio: 0.50,
    accountCode: '3200',
  },
  PARTNER_B: {
    name: 'Bokhtiar Raman',
    ratio: 0.50,
    accountCode: '3300',
  },
} as const;

export const INVESTOR_CONFIG = {
  name: 'Noyon Islam',
  accountCode: '2300',
} as const;

/**
 * Opening balances
 */
export const OPENING_BALANCES = {
  SECURITY_DEPOSIT: 95000, // 190,000 / 2 per partner — total 190,000
} as const;
