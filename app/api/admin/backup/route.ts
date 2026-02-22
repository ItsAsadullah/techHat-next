import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/require-role';

const db = prisma as any;

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [
      settings,
      categories,
      brands,
      products,
      variants,
      productSpecs,
      stockHistory,
      orders,
      orderItems,
      orderPayments,
      posCustomers,
      duePayments,
      expenseCategories,
      expenses,
      suppliers,
      purchases,
      purchaseItems,
      supplierPayments,
      staff,
      staffSalaries,
      reviews,
    ] = await Promise.all([
      prisma.setting.findMany(),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.product.findMany(),
      prisma.variant.findMany(),
      prisma.productSpec.findMany(),
      prisma.stockHistory.findMany(),
      prisma.order.findMany(),
      prisma.orderItem.findMany(),
      prisma.orderPayment.findMany(),
      db.pOSCustomer.findMany(),
      db.duePayment.findMany(),
      prisma.expenseCategory.findMany(),
      prisma.expense.findMany(),
      db.supplier.findMany(),
      db.purchase.findMany(),
      db.purchaseItem.findMany(),
      db.supplierPayment.findMany(),
      prisma.staff.findMany(),
      prisma.staffSalary.findMany(),
      prisma.review.findMany(),
    ]);

    const backup = {
      meta: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        appName: 'TechHat POS',
        totalRecords: {
          products: products.length,
          orders: orders.length,
          expenses: expenses.length,
          customers: posCustomers.length,
          suppliers: suppliers.length,
          staff: staff.length,
        },
      },
      data: {
        settings,
        categories,
        brands,
        products,
        variants,
        productSpecs,
        stockHistory,
        orders,
        orderItems,
        orderPayments,
        posCustomers,
        duePayments,
        expenseCategories,
        expenses,
        suppliers,
        purchases,
        purchaseItems,
        supplierPayments,
        staff,
        staffSalaries,
        reviews,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="techhat-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
