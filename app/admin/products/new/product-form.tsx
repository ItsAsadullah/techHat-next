'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useProductForm } from '@/components/admin/products/product-form/hooks/useProductForm';
import { useVariants } from '@/components/admin/products/product-form/hooks/useVariants';
import { useSpecifications } from '@/components/admin/products/product-form/hooks/useSpecifications';

import { ProductBasicSection } from '@/components/admin/products/product-form/sections/ProductBasicSection';
import { ProductPricingSection } from '@/components/admin/products/product-form/sections/ProductPricingSection';
import { ProductInventoryConfigSection } from '@/components/admin/products/product-form/sections/ProductInventoryConfigSection';
import { ProductVariantSection } from '@/components/admin/products/product-form/sections/ProductVariantSection';
import { ProductSpecificationSection } from '@/components/admin/products/product-form/sections/ProductSpecificationSection';
import { ProductAdvancedSection } from '@/components/admin/products/product-form/sections/ProductAdvancedSection';
import { ProductMediaSection, GalleryImage } from '@/components/admin/products/product-form/sections/ProductMediaSection';

import { createProduct, updateProduct } from '@/lib/actions/product-actions';
import { ProductFormValues } from '@/components/admin/products/product-form/schemas/product.schema';

interface ProductFormProps {
  categories: any[];
  brands: any[];
  attributesList: any[];
  initialData?: any;
}

export default function ProductForm({ categories, brands, attributesList, initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialData?.images || []);
  
  const form = useProductForm(initialData);
  const variantsHook = useVariants(initialData?.attributes || [], initialData?.variants || []);
  const specsHook = useSpecifications(initialData?.productSpecs || [{ id: '1', key: '', value: '' }]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);
      const payload = {
        ...data,
        images: galleryImages,
        variants: variantsHook.variations,
        attributes: variantsHook.attributes,
        productSpecs: specsHook.specs.filter(s => s.key && s.value),
      };

      const res = initialData?.id
        ? await updateProduct(initialData.id, payload as any)
        : await createProduct(payload as any);
        
      if (res.success) {
        toast.success(initialData?.id ? 'Product updated successfully' : 'Product created successfully');
        router.push('/admin/products');
      } else {
        toast.error(res.error || 'Failed to save product');
      }
    } catch (e) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Mobile Accordion Wrapper
  const Section = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => (
    <div className="bg-card border rounded-none md:rounded-lg overflow-hidden md:p-6 mb-2 md:mb-6">
      {/* Desktop View */}
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
      {/* Mobile View */}
      <details className="md:hidden group" open={defaultOpen}>
        <summary className="p-4 font-semibold text-base cursor-pointer select-none list-none flex justify-between items-center border-b bg-muted/20">
          {title}
          <span className="transition group-open:rotate-180 text-muted-foreground">
            <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
          </span>
        </summary>
        <div className="p-4 bg-background border-b">
          {children}
        </div>
      </details>
    </div>
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0 md:space-y-6 pb-20 md:pb-0 bg-muted/10 md:bg-transparent min-h-screen">
        
        {/* Mobile Sticky Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b p-3 flex items-center justify-between md:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-semibold text-sm">{initialData ? 'Edit Product' : 'Add Product'}</h1>
          </div>
          <Button type="submit" size="sm" disabled={loading} className="h-8">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{initialData ? 'Edit Product' : 'Add Product'}</h1>
              <p className="text-sm text-muted-foreground">Manage your product master data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" /> Save Product
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-6 p-0 md:p-0">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-0 md:space-y-6">
            <Section title="Basic Information">
              <ProductBasicSection categories={categories} brands={brands} />
            </Section>

            <Section title="Media">
              <ProductMediaSection images={galleryImages} setImages={setGalleryImages} onOpenMediaLibrary={() => {
                toast.info('Media upload logic to be integrated');
              }} />
            </Section>

            <Section title="Pricing">
              <ProductPricingSection />
            </Section>

            <Section title="Inventory Config">
              <ProductInventoryConfigSection />
            </Section>
            
            <Section title="Variations" defaultOpen={false}>
              <ProductVariantSection variantsHook={variantsHook} attributesList={attributesList} />
            </Section>

            <Section title="Specifications" defaultOpen={false}>
              <ProductSpecificationSection specsHook={specsHook} />
            </Section>
          </div>

          {/* Side Column */}
          <div className="space-y-0 md:space-y-6">
            <Section title="Status & Visibility">
              <ProductAdvancedSection />
            </Section>
          </div>

        </div>
      </form>
    </FormProvider>
  );
}
