
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category_id');

  if (!categoryId) {
    return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
  }

  try {
    // Try to use typed client first, fallback to raw if needed
    // Since generation failed, we use raw query to be safe
    const templates = await prisma.$queryRaw<any[]>`
      SELECT id, name, category_id as "categoryId", sort_order as "sortOrder"
      FROM "spec_templates"
      WHERE "category_id" = ${categoryId}
      ORDER BY "sort_order" ASC
    `;

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching spec templates:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
