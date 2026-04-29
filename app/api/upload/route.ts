import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { requireStaff } from '@/lib/auth/require-role';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  const authError = await requireStaff();
  if (authError) return authError;

  // Reject very large uploads to protect the server
  const MAX_BYTES = 250 * 1024 * 1024; // 250 MB
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 250 MB.' }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 250 MB.' }, { status: 413 });
    }

    const folder = (formData.get('folder') as string) || 'general';
    const isVideo = file.type.startsWith('video/');
    const isGif = file.type === 'image/gif' || file.name?.toLowerCase().endsWith('.gif');

    const useChunked = file.size >= 12 * 1024 * 1024; // 12MB+

    const uploadOptions: any = {
      folder: `techhat/${folder}`,
      resource_type: 'auto',
      ...(isVideo || isGif ? {} : { format: 'webp', quality: 'auto' }),
      ...(useChunked ? { chunk_size: 10 * 1024 * 1024 } : {}),
    };

    const url = await new Promise<string>((resolve, reject) => {
      const cb = (error: any, result: any) => {
        if (error) reject(error);
        else resolve(result?.secure_url || '');
      };

      const cloudinaryStream = useChunked
        ? cloudinary.uploader.upload_large_stream(uploadOptions, cb)
        : cloudinary.uploader.upload_stream(uploadOptions, cb);

      const nodeStream = Readable.fromWeb(file.stream() as any);
      nodeStream.on('error', reject);
      nodeStream.pipe(cloudinaryStream);
    });

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
