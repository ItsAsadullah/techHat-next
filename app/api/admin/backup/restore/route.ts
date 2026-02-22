import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth/require-role';

const db = prisma as any;

export async function POST(req: NextRequest) {
  // Destructive operation — requires super_admin
  const authError = await requireSuperAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { data, meta } = body;

    if (!data || !meta) {
      return NextResponse.json({ error: 'Invalid backup file format' }, { status: 400 });
    }

    const results: Record<string, { inserted: number; skipped: number }> = {};

    const safeCreate = async (label: string, fn: () => Promise<any>) => {
      try {
        const r = await fn();
        results[label] = { inserted: r?.count ?? 0, skipped: 0 };
      } catch (e: any) {
        results[label] = { inserted: 0, skipped: 1 };
      }
    };

    // 1. Settings
    await safeCreate('settings', () =>
      prisma.setting.createMany({ data: data.settings ?? [], skipDuplicates: true }),
    );

    // 2. Categories (insert without parent first, then patch parents)
    if (data.categories?.length) {
      const withoutParent = (data.categories as any[]).map((c: any) => ({ ...c, parentId: null }));
      await safeCreate('categories', () =>
        prisma.category.createMany({ data: withoutParent, skipDuplicates: true }),
      );
      // patch parentIds
      for (const cat of data.categories as any[]) {
        if (cat.parentId) {
          await prisma.category.updateMany({
            where: { id: cat.id },
            data: { parentId: cat.parentId },
          }).catch(() => null);
        }
      }
    }

    // 3. Brands
    await safeCreate('brands', () =>
      prisma.brand.createMany({ data: data.brands ?? [], skipDuplicates: true }),
    );

    // 4. Products
    await safeCreate('products', () =>
      prisma.product.createMany({ data: data.products ?? [], skipDuplicates: true }),
    );

    // 5. Variants
    await safeCreate('variants', () =>
      prisma.variant.createMany({ data: data.variants ?? [], skipDuplicates: true }),
    );

    // 6. Product specs & stock history
    await safeCreate('productSpecs', () =>
      prisma.productSpec.createMany({ data: data.productSpecs ?? [], skipDuplicates: true }),
    );
    await safeCreate('stockHistory', () =>
      prisma.stockHistory.createMany({ data: data.stockHistory ?? [], skipDuplicates: true }),
    );

    // 7. Expense categories & expenses
    await safeCreate('expenseCategories', () =>
      prisma.expenseCategory.createMany({ data: data.expenseCategories ?? [], skipDuplicates: true }),
    );
    await safeCreate('expenses', () =>
      prisma.expense.createMany({ data: data.expenses ?? [], skipDuplicates: true }),
    );

    // 8. Staff & salaries
    await safeCreate('staff', () =>
      prisma.staff.createMany({ data: data.staff ?? [], skipDuplicates: true }),
    );
    await safeCreate('staffSalaries', () =>
      prisma.staffSalary.createMany({ data: data.staffSalaries ?? [], skipDuplicates: true }),
    );

    // 9. POS customers
    await safeCreate('posCustomers', () =>
      db.pOSCustomer.createMany({ data: data.posCustomers ?? [], skipDuplicates: true }),
    );

    // 10. Suppliers, purchases, items, payments
    await safeCreate('suppliers', () =>
      db.supplier.createMany({ data: data.suppliers ?? [], skipDuplicates: true }),
    );
    await safeCreate('purchases', () =>
      db.purchase.createMany({ data: data.purchases ?? [], skipDuplicates: true }),
    );
    await safeCreate('purchaseItems', () =>
      db.purchaseItem.createMany({ data: data.purchaseItems ?? [], skipDuplicates: true }),
    );
    await safeCreate('supplierPayments', () =>
      db.supplierPayment.createMany({ data: data.supplierPayments ?? [], skipDuplicates: true }),
    );

    // 11. Orders, items, payments, due payments
    await safeCreate('orders', () =>
      prisma.order.createMany({ data: data.orders ?? [], skipDuplicates: true }),
    );
    await safeCreate('orderItems', () =>
      prisma.orderItem.createMany({ data: data.orderItems ?? [], skipDuplicates: true }),
    );
    await safeCreate('orderPayments', () =>
      prisma.orderPayment.createMany({ data: data.orderPayments ?? [], skipDuplicates: true }),
    );
    await safeCreate('duePayments', () =>
      db.duePayment.createMany({ data: data.duePayments ?? [], skipDuplicates: true }),
    );

    // 12. Reviews
    await safeCreate('reviews', () =>
      prisma.review.createMany({ data: data.reviews ?? [], skipDuplicates: true }),
    );

    const totalInserted = Object.values(results).reduce((s, r) => s + r.inserted, 0);
    return NextResponse.json({ success: true, totalInserted, results });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
