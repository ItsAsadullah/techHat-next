'use server';

import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { revalidatePath, unstable_cache } from 'next/cache';

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

    revalidatePath('/admin/products/new');
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

    revalidatePath('/admin/products/new');
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
    
    revalidatePath('/admin/products/new');
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
