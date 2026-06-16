'use client';

import { useRef, useState, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, Star, GripVertical, Upload } from 'lucide-react';
import NextImage from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { MediaLibrary } from '@/components/admin/media-library';

export interface GalleryImage {
  id:          string;
  url:         string;
  isThumbnail: boolean;
  alt?:        string;
}

interface Props {
  images:              GalleryImage[];
  setImages:           (images: GalleryImage[]) => void;
}

export function ProductMediaSection({ images, setImages }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSourceIndex             = useRef<number>(-1);

  // ── Thumbnail ─────────────────────────────────────────────────────────────
  const handleSetThumbnail = useCallback((id: string) => {
    setImages(images.map(img => ({ ...img, isThumbnail: img.id === id })));
  }, [images, setImages]);

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = useCallback((id: string) => {
    const filtered = images.filter(img => img.id !== id);
    // If we removed the thumbnail, make the first remaining image the thumbnail
    const hasThumbnail = filtered.some(img => img.isThumbnail);
    if (!hasThumbnail && filtered.length > 0) {
      filtered[0] = { ...filtered[0], isThumbnail: true };
    }
    setImages(filtered);
  }, [images, setImages]);

  // ── Alt text ──────────────────────────────────────────────────────────────
  const handleAltChange = useCallback((id: string, alt: string) => {
    setImages(images.map(img => img.id === id ? { ...img, alt } : img));
  }, [images, setImages]);

  // ── Drag reorder ──────────────────────────────────────────────────────────
  const handleDragStart = (id: string, index: number) => {
    setDraggingId(id);
    dragSourceIndex.current = index;
  };

  // ── Media Library ─────────────────────────────────────────────────────────
  const handleLibrarySelect = useCallback((urls: string | string[]) => {
    const urlArray = Array.isArray(urls) ? urls : [urls];
    
    setImages((prev) => {
      const newImages = urlArray.map((url, i) => ({
        id: Math.random().toString(36).substring(2, 11) + i,
        url,
        isThumbnail: prev.length === 0 && i === 0,
      }));
      return [...prev, ...newImages];
    });
  }, [setImages]);

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragSourceIndex.current === -1 || dragSourceIndex.current === targetIndex) {
      setDraggingId(null);
      setDragOverId(null);
      return;
    }

    const reordered = [...images];
    const [moved]   = reordered.splice(dragSourceIndex.current, 1);
    reordered.splice(targetIndex, 0, moved);

    setImages(reordered);
    setDraggingId(null);
    setDragOverId(null);
    dragSourceIndex.current = -1;
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverId(null);
    dragSourceIndex.current = -1;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Product Images</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Drag to reorder · Click ★ to set main image
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MediaLibrary
            onSelect={handleLibrarySelect}
            multiple={true}
            trigger={
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs">
                <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Library
              </Button>
            }
          />
          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign"
            onSuccess={(result) => {
              if (typeof result.info === 'object' && result.info.secure_url) {
                const newImage: GalleryImage = {
                  id: Math.random().toString(36).substring(2, 11),
                  url: result.info.secure_url,
                  // Using a functional state update to ensure isThumbnail is correct
                  isThumbnail: false, // We'll handle this inside setImages
                };
                setImages((prev) => {
                  const isThumbnail = prev.length === 0;
                  return [...prev, { ...newImage, isThumbnail }];
                });
              }
            }}
            options={{
              multiple: true,
              resourceType: "image",
              clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
              folder: "products/gallery",
              sources: ['local', 'url', 'camera', 'google_drive', 'image_search', 'unsplash']
            }}
          >
            {({ open }) => (
              <Button type="button" variant="default" size="sm" className="h-8 text-xs" onClick={() => open()}>
                <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
              </Button>
            )}
          </CldUploadWidget>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, index) => (
          <div
            key={img.id}
            draggable
            onDragStart={() => handleDragStart(img.id, index)}
            onDragOver={(e) => handleDragOver(e, img.id)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group border rounded-lg overflow-hidden bg-muted transition-all duration-150 ${
              draggingId === img.id
                ? 'opacity-40 ring-2 ring-blue-500 scale-95'
                : dragOverId === img.id && draggingId !== img.id
                ? 'ring-2 ring-blue-400 ring-offset-1'
                : ''
            }`}
          >
            {/* Image */}
            <div className="aspect-square relative">
              <NextImage
                src={img.url}
                alt={img.alt || 'Product image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                {/* Top: remove */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemove(img.id)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {/* Bottom: set main */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleSetThumbnail(img.id)}
                    className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${
                      img.isThumbnail
                        ? 'bg-yellow-400 text-black'
                        : 'bg-white/80 text-black hover:bg-white'
                    }`}
                  >
                    <Star className={`w-2.5 h-2.5 ${img.isThumbnail ? 'fill-current' : ''}`} />
                    {img.isThumbnail ? 'Main' : 'Set Main'}
                  </button>
                </div>
              </div>
            </div>

            {/* Drag handle */}
            <div className="absolute top-1 left-1 p-0.5 bg-black/30 rounded cursor-grab opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripVertical className="w-3 h-3 text-white" />
            </div>

            {/* Main badge */}
            {img.isThumbnail && (
              <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] px-1.5 py-0.5 rounded font-bold leading-none z-10">
                MAIN
              </div>
            )}

            {/* Alt text input — shown below image */}
            <div className="border-t px-1.5 py-1">
              <input
                type="text"
                value={img.alt || ''}
                onChange={(e) => handleAltChange(img.id, e.target.value)}
                placeholder="Alt text..."
                className="w-full text-[10px] bg-transparent outline-none text-muted-foreground placeholder-muted-foreground/50 truncate"
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              />
            </div>
          </div>
        ))}

        {/* Add more slot */}
        <div className="flex gap-2">
          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign"
            onSuccess={(result) => {
              if (typeof result.info === 'object' && result.info.secure_url) {
                const newImage: GalleryImage = {
                  id: Math.random().toString(36).substring(2, 11),
                  url: result.info.secure_url,
                  isThumbnail: false,
                };
                setImages((prev) => {
                  const isThumbnail = prev.length === 0;
                  return [...prev, { ...newImage, isThumbnail }];
                });
              }
            }}
            options={{ 
              multiple: true, 
              resourceType: "image", 
              clientAllowedFormats: ["png", "jpeg", "jpg", "webp"], 
              folder: "products/gallery",
              sources: ['local', 'url', 'camera', 'google_drive', 'image_search', 'unsplash']
            }}
          >
            {({ open }) => (
              <div
                className="aspect-square w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-muted-foreground/30 transition"
                onClick={() => open()}
              >
                <Upload className="w-6 h-6 mb-1 opacity-40" />
                <span className="text-[10px]">Upload</span>
              </div>
            )}
          </CldUploadWidget>
          
          <MediaLibrary
            onSelect={handleLibrarySelect}
            multiple={true}
            trigger={
              <div className="aspect-square w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-muted-foreground/30 transition">
                <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                <span className="text-[10px]">Library</span>
              </div>
            }
          />
        </div>
      </div>

      {images.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign"
            onSuccess={(result) => {
              if (typeof result.info === 'object' && result.info.secure_url) {
                const newImage: GalleryImage = {
                  id: Math.random().toString(36).substring(2, 11),
                  url: result.info.secure_url,
                  isThumbnail: false,
                };
                setImages((prev) => {
                  const isThumbnail = prev.length === 0;
                  return [...prev, { ...newImage, isThumbnail }];
                });
              }
            }}
            options={{ 
              multiple: true, 
              resourceType: "image", 
              clientAllowedFormats: ["png", "jpeg", "jpg", "webp"], 
              folder: "products/gallery",
              sources: ['local', 'url', 'camera', 'google_drive', 'image_search', 'unsplash']
            }}
          >
            {({ open }) => (
              <div
                className="py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/20 transition"
                onClick={() => open()}
              >
                <Upload className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Upload New Images</p>
                <p className="text-xs mt-1 opacity-70">Click to upload from device</p>
              </div>
            )}
          </CldUploadWidget>

          <MediaLibrary
            onSelect={handleLibrarySelect}
            multiple={true}
            trigger={
              <div className="py-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/20 transition">
                <ImageIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Browse Library</p>
                <p className="text-xs mt-1 opacity-70">Select from existing Cloudinary images</p>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
