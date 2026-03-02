import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireStaff } from '@/lib/auth/require-role';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  const authError = await requireStaff();
  if (authError) return authError;

  // Reject files larger than 50 MB before processing
  const MAX_BYTES = 50 * 1024 * 1024;
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50 MB.' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const folder = (formData.get('folder') as string) || 'general';
    const isVideo = file.type.startsWith('video/');

    const url = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `techhat/${folder}`,
          resource_type: 'auto',
          ...(isVideo ? {} : { format: 'webp', quality: 'auto' }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result?.secure_url || '');
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
