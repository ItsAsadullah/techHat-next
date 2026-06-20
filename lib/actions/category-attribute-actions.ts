'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getCategoryAttributes(categoryId: string) {
  try {
    const data = await prisma.categoryAttribute.findMany({
      where: { categoryId },
      orderBy: { displayOrder: 'asc' },
      include: {
        attribute: {
          include: {
            values: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      }
    });
    return data;
  } catch (error) {
    console.error('Failed to get category attributes:', error);
    return [];
  }
}

export async function syncCategoryAttributes(categoryId: string, attributes: { attributeId: string, isRequired: boolean, displayOrder: number }[]) {
  try {
    // Delete existing
    await prisma.categoryAttribute.deleteMany({
      where: { categoryId }
    });

    // Insert new
    if (attributes.length > 0) {
      await prisma.categoryAttribute.createMany({
        data: attributes.map(a => ({
          categoryId,
          attributeId: a.attributeId,
          isRequired: a.isRequired,
          displayOrder: a.displayOrder
        }))
      });
    }

    revalidatePath('/admin/settings/categories');
    revalidatePath(`/admin/settings/categories/${categoryId}/attributes`);
    return { success: true };
  } catch (error) {
    console.error('Failed to sync category attributes:', error);
    return { success: false, error: 'Failed to sync attributes' };
  }
}

export async function getAllCategoryAttributes() {
  try {
    const data = await prisma.categoryAttribute.findMany({
      select: {
        categoryId: true,
        attributeId: true,
        isRequired: true,
      }
    });
    return data;
  } catch (error) {
    console.error('Failed to get all category attributes:', error);
    return [];
  }
}
