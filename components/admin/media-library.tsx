'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Upload, Image as ImageIcon, Search, Check } from 'lucide-react';
import { getCloudinaryImages, uploadImage } from '@/lib/actions/upload-actions';
import { toast } from 'sonner';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface MediaLibraryProps {
  onSelect: (url: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface CloudinaryImage {
  id: string;
  url: string;
  width: number;
  height: number;
  format: string;
}

export function MediaLibrary({ onSelect, open: controlledOpen, onOpenChange, trigger }: MediaLibraryProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const fetchImages = async (cursor?: string) => {
    setLoading(true);
    try {
      const result = await getCloudinaryImages(cursor);
      if (result.success) {
        if (cursor) {
          setImages(prev => [...prev, ...result.images]);
        } else {
          setImages(result.images);
        }
        setNextCursor(result.nextCursor || null);
      } else {
        toast.error('Failed to load images');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error loading images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && images.length === 0) {
      fetchImages();
    }
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadImage(formData);

      if (result.success && result.url) {
        toast.success('Image uploaded successfully', { id: toastId });
        // Refresh list
        fetchImages();
        // Auto select uploaded image
        setSelectedUrl(result.url);
      } else {
        toast.error('Failed to upload image', { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error uploading image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      setIsOpen(false);
      setSelectedUrl(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0" aria-describedby={undefined}>
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-500" />
            Media Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs defaultValue="gallery" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2 border-b bg-gray-50 flex justify-between items-center shrink-0">
              <TabsList>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="upload">Upload New</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                 <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchImages()} 
                    disabled={loading}
                    title="Refresh"
                 >
                    Refresh
                 </Button>
              </div>
            </div>

            <TabsContent value="gallery" className="flex-1 p-0 m-0 min-h-0 relative">
              <ScrollArea className="h-full p-6">
                {images.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    <p>No images found in Cloudinary</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-20">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className={cn(
                          "relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer group transition-all",
                          selectedUrl === img.url 
                            ? "border-blue-500 ring-2 ring-blue-200" 
                            : "border-gray-200 hover:border-blue-300"
                        )}
                        onClick={() => setSelectedUrl(img.url)}
                      >
                        <Image
                          src={img.url}
                          alt="Cloudinary Image"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 20vw"
                        />
                        {selectedUrl === img.url && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm">
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.width}x{img.height} • {img.format}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {loading && (
                   <div className="flex justify-center py-8">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                   </div>
                )}
                
                {!loading && nextCursor && (
                   <div className="flex justify-center py-4">
                      <Button variant="outline" onClick={() => fetchImages(nextCursor)}>
                        Load More
                      </Button>
                   </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upload" className="flex-1 flex items-center justify-center p-6 m-0 bg-gray-50/30 min-h-0">
               <div className="text-center max-w-md w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-all cursor-pointer relative group">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        onChange={handleUpload}
                        disabled={uploading}
                      />
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {uploading ? 'Uploading...' : 'Click to Upload Image'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        SVG, PNG, JPG or GIF (max 10MB)
                      </p>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
           <div className="text-xs text-gray-500">
              {selectedUrl ? '1 image selected' : 'No image selected'}
           </div>
           <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirm} disabled={!selectedUrl} className="bg-blue-600 hover:bg-blue-700">
                 Insert Image
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
