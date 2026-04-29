'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const db = prisma as any

// ═══════════════ TYPES ═══════════════

export interface ExpenseCategoryInput {
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface ExpenseInput {
  categoryId: string;
  title: string;
  amount: number;
  date?: string;
  note?: string;
  attachment?: string;
  reference?: string;
  paymentMethod?: string;
  paidTo?: string;
  isRecurring?: boolean;
  vendorId?: string;
  status?: string;
  addedBy?: string;
  staffId?: string;
}

export interface StaffInput {
  name: string;
  phone: string;
  email?: string;
  role?: string;
  joiningDate?: string;
  baseSalary?: number;
  isActive?: boolean;
  address?: string;
  nidNumber?: string;
  emergencyContact?: string;
}

export interface SalaryInput {
  staffId: string;
  month: number;
  year: number;
  basicSalary: number;
  overtime?: number;
  bonus?: number;
  deduction?: number;
  advance?: number;
  paymentMethod?: string;
  note?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}

// ═══════════════ EXPENSE CATEGORIES ═══════════════

export async function getExpenseCategories() {
  try {
    const categories = await prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { expenses: true } },
      },
    });
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

function buildSlug(name: string): string {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '').replace(/^-+|-+$/g, '');
  return base || `cat-${Date.now().toString(36)}`;
}

export async function createExpenseCategory(input: ExpenseCategoryInput) {
  try {
    const slug = input.slug || buildSlug(input.name);
    const category = await prisma.expenseCategory.create({
      data: {
        name: input.name,
        slug,
        icon: input.icon || null,
        color: input.color || '#6B7280',
        description: input.description || null,
        isActive: input.isActive !== false,
      },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: category };
  } catch (error: any) {
    if ((error as any)?.code === 'P2002') {
      if ((error as any)?.meta?.target?.includes('name')) {
        return { success: false, error: 'এই নামের ক্যাটাগরি আগে থেকেই আছে' };
      }
      // slug collision — retry with a unique slug
      try {
        const slug = `cat-${Date.now().toString(36)}`;
        const category = await prisma.expenseCategory.create({
          data: {
            name: input.name,
            slug,
            icon: input.icon || null,
            color: input.color || '#6B7280',
            description: input.description || null,
            isActive: input.isActive !== false,
          },
        });
        revalidatePath('/admin/expenses');
        return { success: true, data: category };
      } catch (retryErr: any) {
        if ((retryErr as any)?.code === 'P2002') return { success: false, error: 'এই নামের ক্যাটাগরি আগে থেকেই আছে' };
        return { success: false, error: (retryErr as any)?.message };
      }
    }
    return { success: false, error: (error as any)?.message };
  }
}

export async function updateExpenseCategory(id: string, input: Partial<ExpenseCategoryInput>) {
  try {
    const data: any = {};
    if (input.name !== undefined) {
      data.name = input.name;
      data.slug = buildSlug(input.name);
    }
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.color !== undefined) data.color = input.color;
    if (input.description !== undefined) data.description = input.description;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const category = await prisma.expenseCategory.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: category };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function deleteExpenseCategory(id: string) {
  try {
    const count = await prisma.expense.count({ where: { categoryId: id } });
    if (count > 0) {
      return { success: false, error: `এই ক্যাটাগরিতে ${count}টি খরচ আছে। আগে সেগুলো মুছুন বা অন্য ক্যাটাগরিতে সরান।` };
    }
    await prisma.expenseCategory.delete({ where: { id } });
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

// ═══════════════ EXPENSES CRUD ═══════════════

export async function createExpense(input: ExpenseInput) {
  try {
    const expense = await prisma.expense.create({
      data: {
        categoryId: input.categoryId,
        title: input.title,
        amount: input.amount,
        date: input.date ? new Date(input.date) : new Date(),
        note: input.note || null,
        attachment: input.attachment || null,
        reference: input.reference || null,
        paymentMethod: input.paymentMethod || 'CASH',
        paidTo: input.paidTo || null,
        isRecurring: input.isRecurring || false,
        vendorId: input.vendorId || null,
      },
      include: { category: true },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: expense };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function updateExpense(id: string, input: Partial<ExpenseInput>) {
  try {
    const data: any = {};
    if (input.categoryId !== undefined) data.categoryId = input.categoryId;
    if (input.title !== undefined) data.title = input.title;
    if (input.amount !== undefined) data.amount = input.amount;
    if (input.date !== undefined) data.date = new Date(input.date);
    if (input.note !== undefined) data.note = input.note;
    if (input.attachment !== undefined) data.attachment = input.attachment;
    if (input.reference !== undefined) data.reference = input.reference;
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
    if (input.paidTo !== undefined) data.paidTo = input.paidTo;
    if (input.isRecurring !== undefined) data.isRecurring = input.isRecurring;
    if (input.status !== undefined) data.status = input.status;
    if (input.addedBy !== undefined) data.addedBy = input.addedBy;
    if (input.staffId !== undefined) data.staffId = input.staffId;

    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: expense };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function updateExpenseStatus(id: string, status: string) {
  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: { status } as any,
      include: { category: true },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: expense };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function deleteExpense(id: string) {
  try {
    await prisma.expense.delete({ where: { id } });
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function getExpenses(filters: ExpenseFilters = {}) {
  try {
    const { page = 1, limit = 20, search, categoryId, dateFrom, dateTo, paymentMethod } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { paidTo: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    return {
      success: true,
      data: expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message, data: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  }
}

export async function getExpenseById(id: string) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { category: true, vendor: true },
    });
    if (!expense) return { success: false, error: 'খরচ পাওয়া যায়নি' };
    return { success: true, data: expense };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

// ═══════════════ EXPENSE STATS & REPORTS ═══════════════

export async function getExpenseStats() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalAllTime,
      totalThisMonth,
      totalLastMonth,
      totalToday,
      totalThisYear,
      categoryBreakdown,
      monthlyTrend,
      recentExpenses,
      totalSalaryThisMonth,
      totalSalaryDue,
      salaryDueBreakdown,
    ] = await Promise.all([
      // Total all time
      db.expense.aggregate({ _sum: { amount: true } }),
      // This month
      db.expense.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      // Last month
      db.expense.aggregate({
        where: { date: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      // Today
      db.expense.aggregate({
        where: { date: { gte: startOfToday } },
        _sum: { amount: true },
        _count: true,
      }),
      // This year
      db.expense.aggregate({
        where: { date: { gte: startOfYear } },
        _sum: { amount: true },
      }),
      // Category breakdown this month
      db.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: startOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      // Monthly trend (last 6 months)
      db.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM date) as month,
          EXTRACT(YEAR FROM date) as year,
          SUM(amount) as total,
          COUNT(*)::int as count
        FROM expenses
        WHERE date >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
        GROUP BY EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
        ORDER BY year, month
      `,
      // Recent 5 expenses
      db.expense.findMany({
        include: { category: true },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      // This month salary total
      db.staffSalary.aggregate({
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
        _sum: { netSalary: true, paidAmount: true },
      }),
      // Total salary due
      db.staffSalary.aggregate({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        _sum: { dueAmount: true },
      }),
      // Per-staff due breakdown
      db.staffSalary.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: {
          id: true,
          month: true,
          year: true,
          netSalary: true,
          paidAmount: true,
          dueAmount: true,
          status: true,
          staff: { select: { name: true } },
        },
        orderBy: { dueAmount: 'desc' },
      }),
    ]);

    // Get categories for breakdown labels
    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true, color: true, icon: true },
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    const categoryData = categoryBreakdown.map((item: any) => {
      const cat = categoryMap.get(item.categoryId) || { name: 'Unknown', color: '#6B7280', icon: '📌' };
      return {
        categoryId: item.categoryId,
        name: (cat as any).name,
        color: (cat as any).color,
        icon: (cat as any).icon,
        total: item._sum.amount || 0,
        count: item._count || 0,
      };
    }).sort((a: any, b: any) => b.total - a.total);

    // Monthly change percentage
    const thisMonthTotal = totalThisMonth._sum?.amount || 0;
    const lastMonthTotal = totalLastMonth._sum?.amount || 0;
    const monthlyChange = lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : 0;

    return {
      success: true,
      data: {
        totalAllTime: totalAllTime._sum?.amount || 0,
        totalThisMonth: thisMonthTotal,
        totalLastMonth: lastMonthTotal,
        totalToday: totalToday._sum?.amount || 0,
        totalThisYear: totalThisYear._sum?.amount || 0,
        expenseCountThisMonth: totalThisMonth._count || 0,
        expenseCountToday: totalToday._count || 0,
        monthlyChange: Math.round(monthlyChange * 10) / 10,
        categoryBreakdown: categoryData,
        monthlyTrend: (monthlyTrend as any).map((m: any) => ({
          month: Number(m.month),
          year: Number(m.year),
          total: Number(m.total),
          count: Number(m.count),
        })),
        recentExpenses,
        salaryThisMonth: totalSalaryThisMonth._sum?.netSalary || 0,
        salaryPaidThisMonth: totalSalaryThisMonth._sum?.paidAmount || 0,
        salaryDueTotal: totalSalaryDue._sum?.dueAmount || 0,
        salaryDueBreakdown: (salaryDueBreakdown as any).map((s: any) => ({
          id: s.id,
          staffName: s.staff?.name || 'অজানা',
          month: s.month,
          year: s.year,
          netSalary: s.netSalary,
          paidAmount: s.paidAmount,
          dueAmount: s.dueAmount,
          status: s.status,
        })),
      },
    };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function getMonthlyReport(month: number, year: number) {
  try {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const [expenses, categoryBreakdown, paymentBreakdown, salaries] = await Promise.all([
      db.expense.findMany({
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      db.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.groupBy({
        by: ['paymentMethod'],
        where: { date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      db.staffSalary.findMany({
        where: { month, year },
        include: { staff: true },
        orderBy: { staff: { name: 'asc' } },
      }),
    ]);

    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true, color: true, icon: true },
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    const totalExpense = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalSalary = salaries.reduce((sum: number, s: any) => sum + s.netSalary, 0);

    return {
      success: true,
      data: {
        expenses,
        totalExpense,
        totalSalary,
        grandTotal: totalExpense + totalSalary,
        categoryBreakdown: categoryBreakdown.map((item: any) => {
          const cat = categoryMap.get(item.categoryId) || { name: 'Unknown', color: '#6B7280' };
          return {
            name: (cat as any).name,
            color: (cat as any).color,
            total: item._sum.amount || 0,
            count: item._count || 0,
          };
        }),
        paymentBreakdown: paymentBreakdown.map((item: any) => ({
          method: item.paymentMethod,
          total: item._sum.amount || 0,
          count: item._count || 0,
        })),
        salaries,
      },
    };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function getReport(params: {
  mode: 'weekly' | 'monthly' | 'yearly' | 'custom';
  dateFrom: string;
  dateTo: string;
  month?: number;
  year?: number;
}) {
  try {
    const start = new Date(params.dateFrom + 'T00:00:00');
    const end = new Date(params.dateTo + 'T23:59:59.999');

    const [expenses, categoryBreakdown, paymentBreakdown, dailyTrend] = await Promise.all([
      db.expense.findMany({
        where: { date: { gte: start, lte: end } },
        include: { category: true },
        orderBy: { date: 'desc' },
      }),
      db.expense.groupBy({
        by: ['categoryId'],
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      db.expense.groupBy({
        by: ['paymentMethod'],
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: true,
      }),
      db.$queryRaw`
        SELECT DATE(date) as day, SUM(amount)::float as total, COUNT(*)::int as count
        FROM expenses
        WHERE date >= ${start} AND date <= ${end}
        GROUP BY DATE(date)
        ORDER BY day
      `,
    ]);

    // Monthly salary data
    let salaries: any[] = [];
    if (params.mode === 'monthly' && params.month && params.year) {
      salaries = await prisma.staffSalary.findMany({
        where: { month: params.month, year: params.year },
        include: { staff: true },
        orderBy: { staff: { name: 'asc' } },
      });
    }

    // Yearly: monthly salary aggregates
    let yearlySalaryByMonth: any[] = [];
    if (params.mode === 'yearly' && params.year) {
      const rows = await prisma.staffSalary.groupBy({
        by: ['month'],
        where: { year: params.year },
        _sum: { netSalary: true, paidAmount: true, dueAmount: true },
        orderBy: { month: 'asc' },
      });
      yearlySalaryByMonth = (rows as any).map((r: any) => ({
        month: r.month,
        netSalary: r._sum?.netSalary || 0,
        paid: r._sum?.paidAmount || 0,
        due: r._sum?.dueAmount || 0,
      }));
    }

    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true, color: true, icon: true },
    });
    const categoryMap = new Map(categories.map((c: any) => [c.id, c]));

    const totalExpense = (expenses as any).reduce((s: number, e: any) => s + e.amount, 0);
    const totalSalary = salaries.reduce((s: number, sal: any) => s + sal.netSalary, 0);
    const totalSalaryPaid = salaries.reduce((s: number, sal: any) => s + sal.paidAmount, 0);
    const totalSalaryDue = salaries.reduce((s: number, sal: any) => s + sal.dueAmount, 0);
    const yearlySalaryTotal = yearlySalaryByMonth.reduce((s, m) => s + m.netSalary, 0);

    const catBreakdown = categoryBreakdown.map((item: any) => {
      const cat = categoryMap.get(item.categoryId) || { name: 'অজানা', color: '#6B7280', icon: '📌' };
      const total = item._sum.amount || 0;
      return {
        name: (cat as any).name,
        color: (cat as any).color,
        icon: (cat as any).icon,
        total,
        count: item._count || 0,
        percent: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
      };
    }).sort((a: any, b: any) => b.total - a.total);

    return {
      success: true,
      data: {
        mode: params.mode,
        expenses,
        totalExpense,
        totalSalary: params.mode === 'yearly' ? yearlySalaryTotal : totalSalary,
        totalSalaryPaid,
        totalSalaryDue,
        grandTotal: totalExpense + (params.mode === 'yearly' ? yearlySalaryTotal : totalSalary),
        categoryBreakdown: catBreakdown,
        paymentBreakdown: (paymentBreakdown as any).map((item: any) => ({
          method: item.paymentMethod,
          total: item._sum.amount || 0,
          count: item._count || 0,
        })),
        dailyTrend: (dailyTrend as any).map((d: any) => ({
          day: String(d.day).split('T')[0],
          total: Number(d.total) || 0,
          count: Number(d.count) || 0,
        })),
        salaries,
        yearlySalaryByMonth,
      },
    };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

// ═══════════════ STAFF MANAGEMENT ═══════════════

export async function getStaffMembers() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { salaries: true } },
      },
    });
    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function getStaffByEmail(email: string) {
  try {
    const staff = await prisma.staff.findFirst({
      where: { email, isActive: true },
      select: { id: true, name: true, role: true, permissions: true },
    });
    return { success: true, data: staff ?? null };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message, data: null };
  }
}

export async function createStaff(input: StaffInput) {
  try {
    const staff = await prisma.staff.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email || null,
        role: input.role || null,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
        baseSalary: input.baseSalary || 0,
        address: input.address || null,
        nidNumber: input.nidNumber || null,
        emergencyContact: input.emergencyContact || null,
      },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: staff };
  } catch (error: any) {
    if ((error as any)?.code === 'P2002') {
      return { success: false, error: 'এই ফোন নম্বর দিয়ে আগে থেকেই একজন স্টাফ আছে' };
    }
    return { success: false, error: (error as any)?.message };
  }
}

export async function updateStaff(id: string, input: Partial<StaffInput>) {
  try {
    const data: any = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.email !== undefined) data.email = input.email;
    if (input.role !== undefined) data.role = input.role;
    if (input.joiningDate !== undefined) data.joiningDate = new Date(input.joiningDate);
    if (input.baseSalary !== undefined) data.baseSalary = input.baseSalary;
    if (input.address !== undefined) data.address = input.address;
    if (input.nidNumber !== undefined) data.nidNumber = input.nidNumber;
    if (input.emergencyContact !== undefined) data.emergencyContact = input.emergencyContact;
    if (input.isActive !== undefined) data.isActive = input.isActive;

    const staff = await prisma.staff.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: staff };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function deleteStaff(id: string) {
  try {
    await prisma.staff.delete({ where: { id } });
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

// ═══════════════ STAFF SALARY ═══════════════

export async function generateMonthlySalaries(month: number, year: number) {
  try {
    const activeStaff = await prisma.staff.findMany({
      where: { isActive: true },
    });

    const results = [];

    for (const staff of activeStaff) {
      // Check if salary already exists
      const existing = await prisma.staffSalary.findUnique({
        where: {
          staffId_month_year: {
            staffId: staff.id,
            month,
            year,
          },
        },
      });

      if (!existing) {
        const netSalary = staff.baseSalary;
        const salary = await prisma.staffSalary.create({
          data: {
            staffId: staff.id,
            month,
            year,
            basicSalary: staff.baseSalary,
            netSalary,
            dueAmount: netSalary,
          },
        });
        results.push(salary);
      }
    }

    revalidatePath('/admin/expenses');
    return {
      success: true,
      data: results,
      message: `${results.length}জন স্টাফের বেতন তৈরি করা হয়েছে`,
    };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function getSalaries(month: number, year: number) {
  try {
    const salaries = await prisma.staffSalary.findMany({
      where: { month, year },
      include: { staff: true },
      orderBy: { staff: { name: 'asc' } },
    });
    return { success: true, data: salaries };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function updateSalary(id: string, input: Partial<SalaryInput> & { paidAmount?: number; status?: string; paymentDate?: string }) {
  try {
    const existing = await prisma.staffSalary.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'বেতন রেকর্ড পাওয়া যায়নি' };

    const data: any = {};
    if (input.overtime !== undefined) data.overtime = input.overtime;
    if (input.bonus !== undefined) data.bonus = input.bonus;
    if (input.deduction !== undefined) data.deduction = input.deduction;
    if (input.advance !== undefined) data.advance = input.advance;
    if (input.paymentMethod !== undefined) data.paymentMethod = input.paymentMethod;
    if (input.note !== undefined) data.note = input.note;

    // Recalculate net salary if any component changed
    const basicSalary = input.basicSalary ?? existing.basicSalary;
    const overtime = input.overtime ?? existing.overtime;
    const bonus = input.bonus ?? existing.bonus;
    const deduction = input.deduction ?? existing.deduction;
    const advance = input.advance ?? existing.advance;
    const netSalary = basicSalary + overtime + bonus - deduction - advance;

    data.basicSalary = basicSalary;
    data.netSalary = netSalary;

    if (input.paidAmount !== undefined) {
      data.paidAmount = input.paidAmount;
      data.dueAmount = netSalary - input.paidAmount;
      data.paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();

      if (input.paidAmount >= netSalary) {
        data.status = 'PAID';
        data.dueAmount = 0;
      } else if (input.paidAmount > 0) {
        data.status = 'PARTIAL';
      } else {
        data.status = 'PENDING';
      }
    } else {
      data.dueAmount = netSalary - existing.paidAmount;
    }

    if (input.status) data.status = input.status;

    const salary = await prisma.staffSalary.update({
      where: { id },
      data,
      include: { staff: true },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: salary };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function paySalary(id: string, amount: number, paymentMethod: string = 'CASH') {
  try {
    const existing = await prisma.staffSalary.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'বেতন রেকর্ড পাওয়া যায়নি' };

    const newPaidAmount = existing.paidAmount + amount;
    const newDueAmount = existing.netSalary - newPaidAmount;

    let status = 'PARTIAL';
    if (newPaidAmount >= existing.netSalary) {
      status = 'PAID';
    } else if (newPaidAmount <= 0) {
      status = 'PENDING';
    }

    const salary = await prisma.staffSalary.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        dueAmount: Math.max(0, newDueAmount),
        status,
        paymentMethod,
        paymentDate: new Date(),
      },
      include: { staff: true },
    });
    revalidatePath('/admin/expenses');
    return { success: true, data: salary };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}

export async function deleteSalary(id: string) {
  try {
    await prisma.staffSalary.delete({ where: { id } });
    revalidatePath('/admin/expenses');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: (error as any)?.message };
  }
}
