'use server';

import { prisma } from '@/lib/prisma';
import slugify from 'slugify';
import { revalidatePath } from 'next/cache';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function createBrand(name: string, logoBase64?: string) {
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
        slug: uniqueSlug,
        logo: logoUrl,
      },
    });

    revalidatePath('/admin/products/new');
    revalidatePath('/admin/brands');
    return { success: true, data: brand };
  } catch (error: any) {
    console.error('Error creating brand:', error);
    return { success: false, error: error?.message || 'Failed to create brand' };
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
