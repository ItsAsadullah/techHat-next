'use server';

import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { revalidatePath, revalidateTag } from 'next/cache';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function createBrand(name: string, logoBase64?: string, shortCode?: string) {
  try {
    if (!name || name.trim() === '') {
      return { success: false, error: 'Brand name is required' };
    }

    const slug = slugify(name, { lower: true, strict: true });
    
    // Check if slug exists
    let uniqueSlug = slug;
    let counter = 1;
    while (await prisma.brand.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    let logoUrl = null;

    // Upload logo to Cloudinary if provided (as base64)
    if (logoBase64) {
      try {
        const base64Data = logoBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        logoUrl = await uploadToCloudinary(buffer, 'brands');
      } catch (uploadError) {
        console.error('Logo upload failed:', uploadError);
        // Continue without logo if upload fails
      }
    }

    const brand = await prisma.brand.create({
      data: {
        name: name.trim(),
        shortCode: shortCode ? shortCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) : null,
        slug: uniqueSlug,
        logo: logoUrl,
      },
    });

    revalidateTag('brands', {});
    revalidatePath('/admin/brands');
    return { success: true, data: brand };
  } catch (error: unknown) {
    console.error('Error creating brand:', error);
    return { success: false, error: (error as Error)?.message || 'Failed to create brand' };
  }
}

export async function getBrands() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return { success: true, data: brands };
  } catch (error) {
    console.error('Error fetching brands:', error);
    return { success: false, error: 'Failed to fetch brands' };
  }
}

export async function updateBrand(id: string, data: { name?: string; shortCode?: string; logo?: string | null }) {
  try {
    if (!id) return { success: false, error: 'Brand ID is required' };

    const updateData: {
      name?: string;
      shortCode?: string | null;
      logo?: string | null;
    } = {};

    if (typeof data.name === 'string' && data.name.trim()) {
      updateData.name = data.name.trim();
    }
    if (typeof data.shortCode !== 'undefined') {
      updateData.shortCode = data.shortCode
        ? data.shortCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
        : null;
    }
    if (typeof data.logo !== 'undefined') {
      updateData.logo = data.logo || null;
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    revalidateTag('brands', {});
    revalidatePath('/admin/settings/brands');
    revalidatePath('/admin/products/new');
    revalidatePath('/admin/products');
    return { success: true, data: brand };
  } catch (error) {
    console.error('Error updating brand:', error);
    return { success: false, error: 'Failed to update brand' };
  }
}

export async function deleteBrand(id: string) {
  try {
    if (!id) return { success: false, error: 'Brand ID is required' };

    const productsCount = await prisma.product.count({ where: { brandId: id } });
    if (productsCount > 0) {
      return { success: false, error: `Cannot delete brand. It is used by ${productsCount} products.` };
    }

    await prisma.brand.delete({ where: { id } });

    revalidateTag('brands', {});
    revalidatePath('/admin/settings/brands');
    revalidatePath('/admin/products/new');
    revalidatePath('/admin/products');
    return { success: true };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return { success: false, error: 'Failed to delete brand' };
  }
}
