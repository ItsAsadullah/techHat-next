'use server';

import { prisma } from '@/lib/prisma';

export async function getAttributes() {
  try {
    // Fallback to raw query because Prisma Client might be stale (locked file on Windows)
    // and not have the new 'attribute' model generated yet.
    const rows: any[] = await prisma.$queryRaw`
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
