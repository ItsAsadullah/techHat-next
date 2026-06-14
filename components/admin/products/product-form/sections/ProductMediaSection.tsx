'use client';

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, X, Star } from 'lucide-react';

export interface GalleryImage {
  id: string;
  url: string;
  isThumbnail: boolean;
}

interface Props {
  images: GalleryImage[];
  setImages: (images: GalleryImage[]) => void;
  onOpenMediaLibrary: () => void;
}

export function ProductMediaSection({ images, setImages, onOpenMediaLibrary }: Props) {
  const handleRemove = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleSetThumbnail = (id: string) => {
    setImages(images.map(img => ({
      ...img,
      isThumbnail: img.id === id
    })));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Product Media</Label>
        <Button type="button" variant="outline" size="sm" onClick={onOpenMediaLibrary}>
          <ImageIcon className="w-4 h-4 mr-2" /> Add Media
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group border rounded-lg overflow-hidden aspect-square bg-muted">
            <img src={img.url} alt="Product" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => handleRemove(img.id)}
                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-center">
                <button 
                  type="button" 
                  onClick={() => handleSetThumbnail(img.id)}
                  className={`text-xs px-2 py-1 rounded-full flex items-center ${img.isThumbnail ? 'bg-yellow-400 text-black' : 'bg-white/80 text-black hover:bg-white'}`}
                >
                  <Star className={`w-3 h-3 mr-1 ${img.isThumbnail ? 'fill-current' : ''}`} /> 
                  {img.isThumbnail ? 'Thumbnail' : 'Set Main'}
                </button>
              </div>
            </div>
            {img.isThumbnail && (
              <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] px-1.5 py-0.5 rounded font-bold">
                Main
              </div>
            )}
          </div>
        ))}
        {images.length === 0 && (
          <div className="col-span-full py-8 border-2 border-dashed rounded-lg text-center bg-muted/30 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition" onClick={onOpenMediaLibrary}>
            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Click to add images from media library</p>
          </div>
        )}
      </div>
    </div>
  );
}
