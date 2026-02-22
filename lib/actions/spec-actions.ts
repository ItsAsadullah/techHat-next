'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getSpecTemplates(categoryId: string) {
  if (!categoryId) return [];
  
  try {
    // Try using the Prisma Client API first
    const templates = await prisma.specTemplate.findMany({
      where: { categoryId },
      orderBy: { sortOrder: 'asc' }
    });
    
    return templates;
  } catch (error) {
    console.error('Prisma Client failed, trying raw query:', error);
    try {
      // Fallback to raw query if the client types are stale
      const templates = await prisma.$queryRaw<any[]>`
        SELECT * FROM "spec_templates"
        WHERE "category_id" = ${categoryId}
        ORDER BY "sort_order" ASC
      `;
      
      return templates.map(t => ({
        id: t.id,
        name: t.name,
        categoryId: t.category_id,
        sortOrder: t.sort_order
      }));
    } catch (rawError) {
      console.error('Error fetching spec templates:', rawError);
      return [];
    }
  }
}

// ----------------------------------------------------------------------
// Custom Saved Templates (User Defined)
// ----------------------------------------------------------------------

export async function getSavedTemplates() {
  try {
    const templates = await prisma.savedSpecTemplate.findMany({
      orderBy: { name: 'asc' }
    });
    return templates;
  } catch (error) {
    console.error('Prisma Client failed for saved templates, trying raw query:', error);
    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT id, name, keys, "createdAt", "updatedAt"
        FROM "saved_spec_templates"
        ORDER BY name ASC
      `;
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        keys: r.keys || [],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    } catch (rawError) {
      console.error('Raw query also failed for saved templates:', rawError);
      return [];
    }
  }
}

export async function createSavedTemplate(name: string, keys: string[]) {
  try {
    // Check if name exists
    let existing: any = null;
    try {
      existing = await prisma.savedSpecTemplate.findUnique({ where: { name } });
    } catch {
      const rows = await prisma.$queryRaw<any[]>`SELECT id FROM "saved_spec_templates" WHERE name = ${name} LIMIT 1`;
      existing = rows.length > 0 ? rows[0] : null;
    }

    if (existing) {
      return { success: false, error: 'Template name already exists' };
    }

    let template: any;
    try {
      template = await prisma.savedSpecTemplate.create({ data: { name, keys } });
    } catch {
      const id = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "saved_spec_templates" (id, name, keys, "createdAt", "updatedAt")
        VALUES (${id}, ${name}, ${keys}::text[], NOW(), NOW())
      `;
      template = { id, name, keys };
    }

    revalidatePath('/admin/products/new');
    return { success: true, template };
  } catch (error) {
    console.error('Error creating saved template:', error);
    return { success: false, error: 'Failed to create template' };
  }
}

export async function deleteSavedTemplate(id: string) {
  try {
    try {
      await prisma.savedSpecTemplate.delete({ where: { id } });
    } catch {
      await prisma.$executeRaw`DELETE FROM "saved_spec_templates" WHERE id = ${id}`;
    }
    revalidatePath('/admin/products/new');
    return { success: true };
  } catch (error) {
    console.error('Error deleting saved template:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}
