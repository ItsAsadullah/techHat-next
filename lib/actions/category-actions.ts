'use server';

import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

export async function getCategoryChildren(parentId: string | null) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: parentId,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return { success: true, categories };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

export async function getCategoryAncestors(categoryId: string) {
  try {
    // Single recursive CTE query instead of N sequential queries
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      name: string;
      slug: string;
      parentId: string | null;
      depth: number;
    }>>`
      WITH RECURSIVE ancestors AS (
        SELECT id, name, slug, "parentId", 0::int AS depth
        FROM "Category"
        WHERE id = ${categoryId}
        UNION ALL
        SELECT c.id, c.name, c.slug, c."parentId", a.depth + 1
        FROM "Category" c
        INNER JOIN ancestors a ON c.id = a."parentId"
      )
      SELECT id, name, slug, "parentId", depth
      FROM ancestors
      ORDER BY depth DESC
    `;

    // rows are ordered: highest depth (root) first → current last
    const path = rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      parentId: (r as any).parentId ?? null,
    }));

    return { success: true, path };
  } catch (error) {
    console.error('Error fetching category ancestors:', error);
    return { success: false, error: 'Failed to fetch category ancestors', path: [] };
  }
}

/**
 * Single-call version that fetches the full ancestor path AND all children
 * needed to render the hierarchy — replaces multiple sequential getCategoryChildren calls.
 */
export async function getCategoryPathWithChildren(categoryId: string) {
  try {
    // Walk up the tree to build the ancestor path
    const path: { id: string; name: string; slug: string; parentId: string | null }[] = [];
    let currentId: string | null = categoryId;

    while (currentId) {
      const category: { id: string; name: string; slug: string; parentId: string | null } | null =
        await prisma.category.findUnique({
          where: { id: currentId },
          select: { id: true, name: true, slug: true, parentId: true },
        });
      if (!category) break;
      path.unshift(category);
      currentId = category.parentId;
    }

    if (path.length === 0) return { success: true, path: [], childrenMap: {} as Record<string, typeof path> };

    // Batch-fetch children for every node in the path in a single query
    const parentIds = path.map((p) => p.id);
    const allChildren = await prisma.category.findMany({
      where: { parentId: { in: parentIds } },
      select: { id: true, name: true, slug: true, parentId: true },
      orderBy: { name: 'asc' },
    });

    // Group children by parentId
    const childrenMap: Record<string, typeof path> = {};
    for (const child of allChildren) {
      if (child.parentId) {
        if (!childrenMap[child.parentId]) childrenMap[child.parentId] = [];
        childrenMap[child.parentId].push(child);
      }
    }

    return { success: true, path, childrenMap };
  } catch (error) {
    console.error('Error fetching category path:', error);
    return { success: false, error: 'Failed to fetch category path', path: [], childrenMap: {} as Record<string, { id: string; name: string; slug: string; parentId: string | null }[]> };
  }
}

export async function createCategory(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string;
    const description = formData.get('description') as string;
    const image = formData.get('image') as string;
    
    if (!name || name.trim() === '') {
      return { success: false, error: 'Category name is required' };
    }

    const slug = slugify(name, { lower: true, strict: true });
    
    // Check if slug exists
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.category.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        parentId: parentId || null,
        description: description || null,
        image: image || null,
      },
    });

    revalidateTag('categories', {});
    revalidatePath('/admin/settings/categories');
    return { success: true, data: category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string;
    const description = formData.get('description') as string;
    const image = formData.get('image') as string;

    if (!id) return { success: false, error: 'Category ID is required' };

    const data: any = {};
    if (name) {
       data.name = name.trim();
       // We might want to update slug too, but usually it's better to keep slugs stable for SEO
       // data.slug = slugify(name, { lower: true, strict: true }); 
    }
    if (parentId !== undefined) data.parentId = parentId || null;
    if (description !== undefined) data.description = description || null;
    if (image !== undefined) data.image = image || null;

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    revalidateTag('categories', {});
    revalidatePath('/admin/settings/categories');
    return { success: true, data: category };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check for children
    const children = await prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      return { success: false, error: 'Cannot delete category with sub-categories. Delete them first.' };
    }
    
    // Check for products
    const products = await prisma.product.count({ where: { categoryId: id } });
    if (products > 0) {
      return { success: false, error: `Cannot delete category. It is used by ${products} products.` };
    }

    await prisma.category.delete({ where: { id } });

    revalidateTag('categories', {});
    revalidatePath('/admin/settings/categories');
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

export const getCategoriesTree = unstable_cache(
  async () => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          parentId: true,
        },
        orderBy: { name: 'asc' }
      });
      const buildTree = (parentId: string | null = null): any[] => {
        return categories
          .filter(cat => cat.parentId === parentId)
          .map(cat => ({
            ...cat,
            children: buildTree(cat.id)
          }));
      };
      return buildTree(null);
    } catch (error) {
      console.error('Error fetching category tree:', error);
      return [];
    }
  },
  ['categories-tree'],
  { revalidate: 600, tags: ['categories'] }
);
