import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/require-role';

const db = prisma as any;

// DELETE selected data categories
// body: { targets: string[] }
// targets can be: 'orders', 'expenses', 'products', 'customers', 'vendors', 'staff', 'reviews', 'stockHistory', 'ALL'

export async function DELETE(req: NextRequest) {
  // Destructive operation — requires super_admin
  const authError = await requireSuperAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const targets: string[] = body.targets ?? [];

    if (!targets.length) {
      return NextResponse.json({ error: 'No targets specified' }, { status: 400 });
    }

    const deleted: Record<string, number> = {};
    const all = targets.includes('ALL');

    const del = async (label: string, fn: () => Promise<any>) => {
      try {
        const r = await fn();
        deleted[label] = r?.count ?? 1;
      } catch {
        deleted[label] = 0;
      }
    };

    // Orders & sales data
    if (all || targets.includes('orders')) {
      await del('orderPayments', () => prisma.orderPayment.deleteMany({}));
      await del('orderItems', () => prisma.orderItem.deleteMany({}));
      await del('duePayments', () => db.duePayment.deleteMany({}));
      await del('returns', () => db.return.deleteMany({}).catch(() => ({ count: 0 })));
      await del('guarantors', () => db.guarantor.deleteMany({}).catch(() => ({ count: 0 })));
      await del('orders', () => prisma.order.deleteMany({}));
    }

    // Expenses
    if (all || targets.includes('expenses')) {
      await del('expenses', () => prisma.expense.deleteMany({}));
    }

    // Customers
    if (all || targets.includes('customers')) {
      await del('posCustomers', () => db.pOSCustomer.deleteMany({}));
    }

    // Stock history only
    if (all || targets.includes('stockHistory')) {
      await del('stockHistory', () => prisma.stockHistory.deleteMany({}));
    }

    // Products (heavy — variants, specs, history, images)
    if (all || targets.includes('products')) {
      await del('stockHistory', () => prisma.stockHistory.deleteMany({}));
      await del('productSpecs', () => prisma.productSpec.deleteMany({}));
      await del('variants', () => prisma.variant.deleteMany({}));
      await del('products', () => prisma.product.deleteMany({}));
    }

    // Vendors / suppliers
    if (all || targets.includes('vendors')) {
      await del('purchaseItems', () => db.purchaseItem.deleteMany({}));
      await del('supplierPayments', () => db.supplierPayment.deleteMany({}));
      await del('purchases', () => db.purchase.deleteMany({}));
      await del('suppliers', () => db.supplier.deleteMany({}));
    }

    // Staff
    if (all || targets.includes('staff')) {
      await del('staffSalaries', () => prisma.staffSalary.deleteMany({}));
      await del('staff', () => prisma.staff.deleteMany({}));
    }

    // Reviews
    if (all || targets.includes('reviews')) {
      await del('reviewImages', () => db.reviewImage.deleteMany({}).catch(() => ({ count: 0 })));
      await del('reviews', () => prisma.review.deleteMany({}));
    }

    // ALL — also clear categories, brands, settings if explicitly ALL
    if (all) {
      await del('expenseCategories', () => prisma.expenseCategory.deleteMany({}));
      await del('brands', () => prisma.brand.deleteMany({}));
      await del('categories', () => prisma.category.updateMany({ where: {}, data: { parentId: null } })
        .then(() => prisma.category.deleteMany({})));
    }

    return NextResponse.json({ success: true, deleted });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
