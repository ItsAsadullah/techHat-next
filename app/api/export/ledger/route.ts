import { NextResponse } from 'next/server';
import { exportLedgerCSV } from '@/lib/actions/ledger-viewer-actions';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filter = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      warehouseId: searchParams.get('warehouseId') || undefined,
      productId: searchParams.get('productId') || undefined,
      referenceType: searchParams.get('referenceType') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const result = await exportLedgerCSV(filter);

    if (!result.success || !result.csv) {
      return new NextResponse('Failed to generate CSV', { status: 500 });
    }

    const filename = `stock-ledger-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(result.csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export ledger error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
