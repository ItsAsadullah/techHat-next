'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { AttributeDataType, AttributeUIType } from '@prisma/client';

export type CreateAttributeData = {
  name: string;
  slug: string;
  description?: string;
  dataType: AttributeDataType;
  uiType: AttributeUIType;
  isVariant?: boolean;
  isFilterable?: boolean;
  isSearchable?: boolean;
  status?: string;
};

export async function getAttributes() {
  try {
    const attributes = await prisma.attribute.findMany({
      orderBy: { name: 'asc' },
      include: {
        values: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
    return attributes;
  } catch (error) {
    console.error('Failed to fetch attributes:', error);
    return [];
  }
}

export async function createAttribute(data: CreateAttributeData) {
  try {
    const attribute = await prisma.attribute.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        dataType: data.dataType,
        uiType: data.uiType,
        isVariant: data.isVariant ?? false,
        isFilterable: data.isFilterable ?? true,
        isSearchable: data.isSearchable ?? true,
        status: data.status || 'ACTIVE',
      },
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true, attribute };
  } catch (error: any) {
    console.error('Failed to create attribute:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Attribute with this slug already exists.' };
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function updateAttribute(id: string, data: Partial<CreateAttributeData>) {
  try {
    const attribute = await prisma.attribute.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true, attribute };
  } catch (error: any) {
    console.error('Failed to update attribute:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function deleteAttribute(id: string) {
  try {
    await prisma.attribute.delete({
      where: { id },
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete attribute:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

// ---- Attribute Values ----

export type CreateAttributeValueData = {
  attributeId: string;
  label: string;
  value: string;
  shortCode?: string;
  colorCode?: string;
  imageUrl?: string;
  metadata?: any;
  displayOrder?: number;
};

export async function createAttributeValue(data: CreateAttributeValueData) {
  try {
    const attrValue = await prisma.attributeValue.create({
      data: {
        attributeId: data.attributeId,
        label: data.label,
        value: data.value,
        shortCode: data.shortCode || null,
        colorCode: data.colorCode || null,
        imageUrl: data.imageUrl || null,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
        displayOrder: data.displayOrder ?? 0,
      },
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true, attrValue };
  } catch (error: any) {
    console.error('Failed to create attribute value:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function updateAttributeValue(id: string, data: Partial<CreateAttributeValueData>) {
  try {
    const attrValue = await prisma.attributeValue.update({
      where: { id },
      data: {
        label: data.label,
        value: data.value,
        shortCode: data.shortCode,
        colorCode: data.colorCode,
        imageUrl: data.imageUrl,
        metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
        displayOrder: data.displayOrder,
      },
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true, attrValue };
  } catch (error: any) {
    console.error('Failed to update attribute value:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

export async function deleteAttributeValue(id: string) {
  try {
    await prisma.attributeValue.delete({
      where: { id },
    });
    revalidatePath('/admin/settings/attributes');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete attribute value:', error);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
