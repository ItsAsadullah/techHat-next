'use server';

import cloudinary, { uploadToCloudinary } from '@/lib/cloudinary';

export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const url = await uploadToCloudinary(buffer, 'editor-uploads');

    return { success: true, url };
  } catch (error: any) {
    console.error('Upload failed:', error);
    return { success: false, error: (error as any)?.message };
  }
}

export async function getCloudinaryImages(nextCursor?: string) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'techhat/', // Only fetch images from our project folder
      max_results: 20,
      next_cursor: nextCursor,
    });

    return {
      success: true,
      images: result.resources.map((res: any) => ({
        id: res.public_id,
        url: res.secure_url,
        width: res.width,
        height: res.height,
        format: res.format,
      })),
      nextCursor: result.next_cursor,
    };
  } catch (error: any) {
    console.error('Failed to fetch images:', error);
    return { success: false, error: (error as any)?.message };
  }
}
