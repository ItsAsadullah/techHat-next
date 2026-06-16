'use server';

import { prisma } from '@/lib/prisma';

export async function getAttributes() {
  try {
    interface AttributeRow {
      id: string;
      name: string;
      slug: string;
      type: string;
      vid: string | null;
      vvalue: string | null;
      vcolor: string | null;
    }

    // Fallback to raw query because Prisma Client might be stale (locked file on Windows)
    // and not have the new 'attribute' model generated yet.
    const rows = await prisma.$queryRaw<AttributeRow[]>`
      SELECT 
        a.id as id, 
        a.name as name, 
        a.slug as slug, 
        a.type as type,
        v.id as vid, 
        v.value as vvalue, 
        v.color_code as vcolor
      FROM attributes a
      LEFT JOIN attribute_values v ON a.id = v.attribute_id AND v.is_active = true
      WHERE a.is_active = true
      ORDER BY a.name ASC, v.display_order ASC
    `;

    // Group by attribute
    const map = new Map();
    rows.forEach(row => {
        if (!map.has(row.id)) {
            map.set(row.id, {
                id: row.id,
                name: row.name,
                slug: row.slug,
                type: row.type,
                values: []
            });
        }
        if (row.vid) {
            map.get(row.id).values.push({
                id: row.vid,
                value: row.vvalue,
                colorCode: row.vcolor
            });
        }
    });

    const attributes = Array.from(map.values());

    return { success: true, attributes };
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return { success: false, error: 'Failed to fetch attributes' };
  }
}

import { revalidatePath } from 'next/cache';
import slugify from 'slugify';

export async function createAttribute(data: { name: string; type?: string; values: { value: string; colorCode?: string }[] }) {
  try {
    const slug = slugify(data.name, { lower: true });
    const attribute = await prisma.attribute.create({
      data: {
        name: data.name,
        slug,
        type: data.type || 'select',
        values: {
          create: data.values.map((v, i) => ({
            value: v.value,
            colorCode: v.colorCode || null,
            displayOrder: i,
          }))
        }
      }
    });
    revalidatePath('/admin/settings/attributes');
    revalidatePath('/admin/products/new');
    return { success: true, attribute };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAttribute(id: number, data: { name: string; type?: string; values: { id?: number; value: string; colorCode?: string }[] }) {
  try {
    const slug = slugify(data.name, { lower: true });
    
    await prisma.$transaction(async (tx) => {
      // Update attribute
      await tx.attribute.update({
        where: { id },
        data: { name: data.name, slug, type: data.type || 'select' },
      });
      
      // Handle values: delete ones not in the list, update existing, create new
      const existingValues = await tx.attributeValue.findMany({ where: { attributeId: id } });
      const incomingIds = data.values.filter(v => v.id).map(v => v.id);
      
      const toDelete = existingValues.filter(v => !incomingIds.includes(v.id)).map(v => v.id);
      if (toDelete.length > 0) {
        await tx.attributeValue.deleteMany({ where: { id: { in: toDelete } } });
      }
      
      for (let i = 0; i < data.values.length; i++) {
        const v = data.values[i];
        if (v.id) {
          await tx.attributeValue.update({
            where: { id: v.id },
            data: { value: v.value, colorCode: v.colorCode || null, displayOrder: i },
          });
        } else {
          await tx.attributeValue.create({
            data: { attributeId: id, value: v.value, colorCode: v.colorCode || null, displayOrder: i },
          });
        }
      }
    });

    revalidatePath('/admin/settings/attributes');
    revalidatePath('/admin/products/new');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAttribute(id: number) {
  try {
    await prisma.attribute.delete({ where: { id } });
    revalidatePath('/admin/settings/attributes');
    revalidatePath('/admin/products/new');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
