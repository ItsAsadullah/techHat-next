'use client';

import { ImagePlus, Trash, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { compressImage } from '@/lib/compress-image';
import { toast } from 'sonner';

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string[]) => void;
  onRemove: (value: string) => void;
  value: string[];
  folder?: string;
}

export default function ImageUpload({
  disabled,
  onChange,
  onRemove,
  value,
  folder = 'invoices'
}: ImageUploadProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      // Compress before upload
      const compressedDataUrl = await compressImage(file, 1600, 1600, 0.82, 1.5);
      const compressedBlob = await fetch(compressedDataUrl).then(r => r.blob());
      const compressedFile = new File([compressedBlob], file.name, { type: compressedBlob.type });

      const formData = new FormData();
      formData.append('file', compressedFile);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success && data.url) {
        onChange([...value, data.url]);
        toast.success('Image uploaded successfully');
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (!isMounted) return null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-4">
        {value.map((url) => (
          <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden group border border-gray-200">
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image
              fill
              className="object-cover"
              alt="Image"
              src={url}
            />
          </div>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
        disabled={disabled || uploading}
      />
      <Button 
        type="button" 
        disabled={disabled || uploading} 
        variant="secondary" 
        onClick={handleButtonClick}
        className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-gray-500">Uploading...</span>
          </>
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-gray-400" />
            <span className="text-gray-500">Click to upload images</span>
          </>
        )}
      </Button>
    </div>
  );
}
