'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Save, Loader2, Clock, Eye, ChevronDown, ChevronRight,
  BarChart2, Calendar, Truck, ShoppingCart, Hourglass,
} from 'lucide-react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useProductForm }    from '@/components/admin/products/product-form/hooks/useProductForm';



import { ProductTypeSwitcher }          from '@/components/admin/products/product-form/sections/ProductTypeSwitcher';
import { ProductBasicSection }          from '@/components/admin/products/product-form/sections/ProductBasicSection';
import { ProductPricingSection }        from '@/components/admin/products/product-form/sections/ProductPricingSection';
import { ProductInventoryConfigSection} from '@/components/admin/products/product-form/sections/ProductInventoryConfigSection';
import { ProductVariantSection }        from '@/components/admin/products/product-form/sections/ProductVariantSection';
import { ProductSpecificationSection }  from '@/components/admin/products/product-form/sections/ProductSpecificationSection';
import { ProductAdvancedSection }       from '@/components/admin/products/product-form/sections/ProductAdvancedSection';
import { ProductMediaSection, GalleryImage } from '@/components/admin/products/product-form/sections/ProductMediaSection';
import { ProductDescriptionSection }    from '@/components/admin/products/product-form/sections/ProductDescriptionSection';
import { ProductSEOSection }            from '@/components/admin/products/product-form/sections/ProductSEOSection';
import { ProductSKUBarcode }            from '@/components/admin/products/product-form/sections/ProductSKUBarcode';
import { ProductQuickActions }          from '@/components/admin/products/product-form/sections/ProductQuickActions';
import { ProductStatusWidget }          from '@/components/admin/products/product-form/sections/ProductStatusWidget';
import { ProductTagsInput }             from '@/components/admin/products/product-form/sections/ProductTagsInput';

import { createProductJSON, updateProductJSON } from '@/lib/actions/product-json-actions';
import { ProductFormValues, statusConfig } from '@/components/admin/products/product-form/schemas/product.schema';

const DynamicPreviewModal = dynamic(
  () => import('./product-preview-modal').then(mod => mod.ProductPreviewModal),
  { ssr: false }
);

interface ProductFormProps {
  categories:    { id: string; name: string }[];
  brands:        { id: string; name: string }[];
  attributesList: unknown[];
  initialData?:  Record<string, unknown> & {
    id?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    images?: any[];
    stock?: number;
    soldCount?: number;
    costPrice?: number;
    slug?: string;
    stockLedgers?: { referenceType: string; date: string | Date; referenceId?: string; warehouse?: { name?: string }; inQty: number; outQty: number; unitCost: number }[];
    purchaseItems?: { purchaseOrder: { poNumber: string; supplier?: { name?: string }; expectedDate?: string | number | Date; status: string }; quantity: number; receivedQty: number; unitCost: number }[];
  };
}

// ─── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border rounded-lg overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Collapsible Section Card ─────────────────────────────────────────────────
function CollapsibleSectionCard({
  title,
  children,
  defaultOpen = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-3 border-b bg-muted/20 flex items-center justify-between hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge}
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

// ─── Sidebar Card ─────────────────────────────────────────────────────────────
function SidebarCard({ title, children, noPad }: { title: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-muted/20">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      </div>
      <div className={noPad ? '' : 'p-4'}>{children}</div>
    </div>
  );
}

// ─── Read-Only Data Row ───────────────────────────────────────────────────────
function DataRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-center justify-between py-1.5 text-xs border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right truncate max-w-[55%] ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

// ─── Mobile Accordion ─────────────────────────────────────────────────────────
function MobileAccordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="bg-card border-b group" open={defaultOpen}>
      <summary className="px-4 py-3 font-medium text-sm cursor-pointer select-none list-none flex justify-between items-center">
        {title}
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────
export default function ProductForm({ categories, brands, attributesList, initialData }: ProductFormProps) {
  const router       = useRouter();
  const [loading,      setLoading]      = useState(false);
  const [previewOpen,  setPreviewOpen]  = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>(initialData?.images || []);
  const isEditMode = !!initialData?.id;

  // Clean up invalid attributes that might have been saved accidentally
  const cleanInitialData = useMemo(() => {
    if (!initialData) return initialData;
    const cleaned = { ...initialData };
    if (cleaned.attributes && Array.isArray(cleaned.attributes)) {
      cleaned.attributes = cleaned.attributes.filter((a: any) => a.name && a.name.trim() !== '');
    }
    return cleaned;
  }, [initialData]);

  const form = useProductForm({ initialData: cleanInitialData, isEditMode });

  // Only watch fields we actually display in the header/sidebar
  const productName       = form.watch('name');
  const sku               = form.watch('sku');
  const barcode           = form.watch('barcode');
  const status            = form.watch('status');
  const productVariantType = form.watch('productVariantType');

  const statusCfg = statusConfig[status] ?? statusConfig['DRAFT'];

  // Time since last update
  const lastUpdated = useMemo(() => {
    if (!initialData?.updatedAt) return null;
    const diff    = Date.now() - new Date(initialData.updatedAt).getTime();
    const hours   = Math.floor(diff / 3600000);
    const minutes = Math.floor(diff / 60000);
    if (hours > 24)  return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0)   return `${hours}h ago`;
    return `${minutes}m ago`;
  }, [initialData?.updatedAt]);

  const createdAt = useMemo(() => {
    if (!initialData?.createdAt) return null;
    return new Date(initialData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }, [initialData?.createdAt]);

  // Category/brand name for sidebar summary
  const categoryName = useMemo(() => {
    const catId = form.getValues('categoryId');
    return categories.find(c => c.id === catId)?.name || null;
  }, [categories, form]);

  const brandName = useMemo(() => {
    const brandId = form.getValues('brandId');
    return brands.find(b => b.id === brandId)?.name || null;
  }, [brands, form]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        images:   galleryImages,
        // Simple products must not carry stale variant data
        variants:   data.productVariantType === 'simple' ? [] : data.variants,
        attributes: data.productVariantType === 'simple' ? [] : data.attributes,
        // Strip blank specs
        productSpecs: (data.productSpecs || []).filter(s => s.key && s.value),
        // costPrice is display-only — never update it from the form
        costPrice: undefined,
      };

      const res = initialData?.id
        ? await updateProductJSON(initialData.id, payload as unknown as Parameters<typeof updateProductJSON>[1])
        : await createProductJSON(payload as unknown as Parameters<typeof createProductJSON>[0]);

      if (res.success) {
        toast.success(initialData?.id ? 'Product updated' : 'Product created');
        router.push('/admin/products');
      } else {
        toast.error(res.error || 'Failed to save');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ─── Header Title ──────────────────────────────────────────────────────────
  const headerTitle = productName?.trim() || (isEditMode ? 'Edit Product' : 'New Product');

  // ─── Inventory snapshot (from initialData — read-only) ─────────────────────
  const stock         = initialData?.stock         ?? null;
  const soldCount     = initialData?.soldCount      ?? null;
  const costPrice     = initialData?.costPrice      ?? null;

  const onError = (errors: any) => {
    console.error("Form errors:", errors);
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      toast.error("Validation failed: " + errorKeys.join(', '));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onError)}>

        {/* Preview Modal */}
        {previewOpen && (
          <DynamicPreviewModal
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            data={{
              ...form.getValues(),
              galleryImages,
              variations:   form.getValues('variants')    || [],
              attributes:   form.getValues('attributes')  || [],
              productType:  form.getValues('productVariantType'),
              categoryName: categories.find(c => c.id === form.getValues('categoryId'))?.name,
              brandName:    brands.find(b => b.id === form.getValues('brandId'))?.name,
              templateSpecs: [],
              specs:        form.getValues('productSpecs') || [],
            } as any}
          />
        )}

        {/* ═══════════════════════════════════════ DESKTOP ══════════════════════════════════════ */}
        <div className="hidden md:block">

          {/* ── Shopify-quality Sticky Header ── */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b -mx-8 px-8 py-2.5">
            <div className="flex items-center justify-between max-w-[1400px] mx-auto">

              {/* Left: Back + Product Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="min-w-0">
                  {/* Product name — live from form */}
                  <h1 className="text-sm font-bold tracking-tight truncate max-w-[360px] leading-tight">
                    {headerTitle}
                  </h1>
                  {/* Metadata row */}
                  <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
                    {sku && (
                      <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {sku}
                      </span>
                    )}
                    {/* Status badge — live */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                    {lastUpdated && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated {lastUpdated}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => setPreviewOpen(true)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={() => router.back()}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="h-8 min-w-[90px]"
                >
                  {loading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <><Save className="h-3.5 w-3.5 mr-1.5" /> Save</>
                  }
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full mt-4">
            <div className="max-w-[1400px] mx-auto mb-2">
              <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2.5 text-sm font-medium">
                  Overview
                </TabsTrigger>
                {isEditMode && (
                  <TabsTrigger value="inventory" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2.5 text-sm font-medium">
                    Stock History
                  </TabsTrigger>
                )}
                {isEditMode && (
                  <TabsTrigger value="purchases" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2.5 text-sm font-medium">
                    Purchase History
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="overview" className="m-0 border-none p-0 outline-none">
              {/* ── Two-Column Grid ── */}
              <div className="grid grid-cols-12 gap-5 pt-3 max-w-[1400px] mx-auto">

                {/* ── LEFT COLUMN (8/12) ── */}
                <div className="col-span-8 space-y-4">

                  <SectionCard title="Product Type">
                    <ProductTypeSwitcher />
                  </SectionCard>

                  <SectionCard title="Product Identity">
                    <ProductBasicSection categories={categories} brands={brands} />
                  </SectionCard>

                  <SectionCard title="Media">
                    <ProductMediaSection
                      images={galleryImages}
                      setImages={setGalleryImages}
                    />
                  </SectionCard>

                  <SectionCard title="Pricing">
                    <ProductPricingSection isEditMode={isEditMode} />
                  </SectionCard>

                  <SectionCard title="Inventory Settings">
                    <ProductInventoryConfigSection />
                  </SectionCard>

                  {productVariantType === 'variable' && (
                    <SectionCard title="Variants">
                      <ProductVariantSection attributesList={attributesList} />
                    </SectionCard>
                  )}

                  <SectionCard title="Specifications">
                    <ProductSpecificationSection />
                  </SectionCard>

                  {/* Description — collapsible, collapsed by default when editing */}
                  <CollapsibleSectionCard
                    title="Description"
                    defaultOpen={!isEditMode}
                    badge={
                      isEditMode ? (
                        <span className="text-[10px] uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">
                          Rarely edited
                        </span>
                      ) : undefined
                    }
                  >
                    <ProductDescriptionSection />
                  </CollapsibleSectionCard>

                  <SectionCard title="SEO">
                    <ProductSEOSection />
                  </SectionCard>
                </div>

                {/* ── RIGHT SIDEBAR (4/12) ── */}
                <div className="col-span-4 space-y-4">

                  {/* 1. Lifecycle Status */}
                  <SidebarCard title="Status">
                    <ProductStatusWidget />
                  </SidebarCard>

                  {/* 2. Product Summary */}
                  <SidebarCard title="Product Summary">
                    <div className="divide-y">
                      <DataRow label="Brand"    value={brandName}    />
                      <DataRow label="Category" value={categoryName} />
                      <DataRow label="SKU"      value={sku}     mono />
                      <DataRow label="Barcode"  value={barcode} mono />
                      <DataRow label="Type"     value={productVariantType === 'variable' ? 'Variable' : 'Simple'} />
                    </div>
                  </SidebarCard>

                  {/* 3. SKU & Barcode */}
                  <SidebarCard title="SKU & Barcode">
                    <ProductSKUBarcode />
                  </SidebarCard>

                  {/* 4. Inventory Summary */}
                  {isEditMode && (
                    <SidebarCard title="Inventory Summary">
                      {/* Current stock from product record */}
                      {stock !== null && (
                        <div className="divide-y mb-3">
                          <DataRow label="Total In Stock" value={`${stock} units`} mono />
                          <DataRow label="Sold Qty" value={soldCount !== null ? `${soldCount} units` : '0 units'} mono />
                          <DataRow label="MAC Val." value={`৳${(stock * (costPrice || 0)).toLocaleString()}`} mono />
                        </div>
                      )}
                      {/* Recent Ledger Entries */}
                      {initialData?.stockLedgers && initialData.stockLedgers.length > 0 ? (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Movements</p>
                          <div className="space-y-2">
                            {initialData.stockLedgers.slice(0, 3).map((l: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">{l.referenceType} ({new Date(l.date).toLocaleDateString()})</span>
                                <span className={`font-mono font-medium ${l.inQty > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {l.inQty > 0 ? `+${l.inQty}` : `-${l.outQty}`}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-muted/50 border">
                          <Hourglass className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] font-semibold">No Stock Movements</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                              No GRN or Sales recorded in the ledger yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </SidebarCard>
                  )}

                  {/* 5. Purchase Summary */}
                  {isEditMode && (
                    <SidebarCard title="Purchase Summary">
                      {/* Average cost is available from product record */}
                      {costPrice !== null && costPrice > 0 && (
                        <div className="divide-y mb-3">
                          <DataRow label="Moving Avg Cost" value={`৳${Number(costPrice).toLocaleString()}`} mono />
                          <DataRow label="Last PO Cost" value={`৳${Number(initialData?.lastPurchaseCost || 0).toLocaleString()}`} mono />
                        </div>
                      )}
                      {/* Recent POs */}
                      {initialData?.purchaseItems && initialData.purchaseItems.length > 0 ? (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent POs</p>
                          <div className="space-y-2">
                            {initialData.purchaseItems.map((pi: any, i: number) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground truncate max-w-[120px]" title={pi.purchaseOrder.supplier?.name}>
                                  {pi.purchaseOrder.poNumber}
                                </span>
                                <span className="font-mono">{pi.receivedQty} / {pi.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-muted/50 border">
                          <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[11px] font-semibold">No Purchase Orders</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                              This product hasn&apos;t been ordered from suppliers yet.
                            </p>
                          </div>
                        </div>
                      )}
                    </SidebarCard>
                  )}

                  {/* 6. Supplier Summary */}
                  {isEditMode && (
                    <SidebarCard title="Suppliers">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded border text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Default:</span>
                        <span className="font-medium">Not Assigned</span>
                      </div>
                    </SidebarCard>
                  )}

                  {/* 7. Tags */}
                  <SidebarCard title="Tags & Keywords">
                    <ProductTagsInput />
                  </SidebarCard>

                  {/* 8. Merchandising Flags */}
                  <SidebarCard title="Merchandising">
                    <ProductAdvancedSection />
                  </SidebarCard>

                  {/* 9. Quick Actions (edit only) */}
                  {isEditMode && (
                    <SidebarCard title="Quick Actions" noPad>
                      <div className="p-2">
                        <ProductQuickActions
                          productId={initialData?.id}
                          slug={initialData?.slug}
                          productName={productName}
                          sku={sku || undefined}
                          barcode={barcode || undefined}
                        />
                      </div>
                    </SidebarCard>
                  )}

                  {/* 10. Activity */}
                  {isEditMode && (
                    <SidebarCard title="Activity">
                      <div className="divide-y">
                        {createdAt && (
                          <div className="flex items-center gap-2 py-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Created</span>
                            <span className="ml-auto font-medium">{createdAt}</span>
                          </div>
                        )}
                        {lastUpdated && (
                          <div className="flex items-center gap-2 py-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Last updated</span>
                            <span className="ml-auto font-medium">{lastUpdated}</span>
                          </div>
                        )}
                      </div>
                    </SidebarCard>
                  )}

                </div>
              </div>
            </TabsContent>

            {/* ── STOCK HISTORY TAB ── */}
            {isEditMode && (
              <TabsContent value="inventory" className="m-0 border-none p-0 outline-none max-w-[1400px] mx-auto pt-3">
                <SectionCard title="Stock Ledger History">
                  {initialData?.stockLedgers && initialData.stockLedgers.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-muted-foreground border-b text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Type</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Ref ID</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Warehouse</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">In</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Out</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Unit Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-card">
                          {initialData.stockLedgers.map((l: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">{new Date(l.date).toLocaleString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium">{l.referenceType}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground font-mono">{l.referenceId?.substring(0,8) || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap">{l.warehouse?.name || 'Main'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-green-600">
                                {l.inQty > 0 ? `+${l.inQty}` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-red-600">
                                {l.outQty > 0 ? `-${l.outQty}` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono">৳{l.unitCost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center border rounded-md border-dashed bg-muted/10">
                      <BarChart2 className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No Stock Ledger Entries</p>
                      <p className="text-xs text-muted-foreground mt-1">This product has not received any inward or outward stock movements.</p>
                    </div>
                  )}
                </SectionCard>
              </TabsContent>
            )}

            {/* ── PURCHASE HISTORY TAB ── */}
            {isEditMode && (
              <TabsContent value="purchases" className="m-0 border-none p-0 outline-none max-w-[1400px] mx-auto pt-3">
                <SectionCard title="Purchase Orders">
                  {initialData?.purchaseItems && initialData.purchaseItems.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted text-muted-foreground border-b text-left">
                          <tr>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">PO Number</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Supplier</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-center">Status</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Qty Ordered</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Qty Received</th>
                            <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Unit Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-card">
                          {initialData.purchaseItems.map((pi: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">{new Date(pi.purchaseOrder.expectedDate || Date.now()).toLocaleDateString()}</td>
                              <td className="px-4 py-3 whitespace-nowrap font-medium font-mono text-primary">{pi.purchaseOrder.poNumber}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{pi.purchaseOrder.supplier?.name || '-'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <span className="text-[10px] uppercase bg-secondary px-2 py-0.5 rounded-full font-semibold tracking-wide">
                                  {pi.purchaseOrder.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono">{pi.quantity}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono">{pi.receivedQty}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-right font-mono">৳{pi.unitCost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center border rounded-md border-dashed bg-muted/10">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No Purchase History</p>
                      <p className="text-xs text-muted-foreground mt-1">This product has not been added to any purchase orders yet.</p>
                    </div>
                  )}
                </SectionCard>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* ═══════════════════════════════════════ MOBILE ═══════════════════════════════════════ */}
        <div className="md:hidden min-h-screen bg-muted/10 pb-20">

          {/* Mobile Sticky Header */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b px-3 py-2.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-sm truncate max-w-[200px]">{headerTitle}</h1>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${statusCfg.bg} ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                </div>
                {sku && <p className="text-[10px] font-mono text-muted-foreground">{sku}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button type="submit" size="sm" disabled={loading} className="h-8 px-4">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>

          {/* Mobile Sections */}
          <div className="divide-y border-t">
            <MobileAccordion title="Product Type" defaultOpen>
              <ProductTypeSwitcher />
            </MobileAccordion>

            <MobileAccordion title="Product Identity" defaultOpen>
              <ProductBasicSection categories={categories} brands={brands} />
            </MobileAccordion>

            <MobileAccordion title="SKU & Barcode">
              <ProductSKUBarcode />
            </MobileAccordion>

            <MobileAccordion title="Media">
              <ProductMediaSection
                images={galleryImages}
                setImages={setGalleryImages}
              />
            </MobileAccordion>

            <MobileAccordion title="Pricing">
              <ProductPricingSection isEditMode={isEditMode} />
            </MobileAccordion>

            <MobileAccordion title="Inventory Settings">
              <ProductInventoryConfigSection />
            </MobileAccordion>

            {productVariantType === 'variable' && (
              <MobileAccordion title="Variants">
                <ProductVariantSection attributesList={attributesList} />
              </MobileAccordion>
            )}

            <MobileAccordion title="Specifications">
              <ProductSpecificationSection />
            </MobileAccordion>

            <MobileAccordion title="Description">
              <ProductDescriptionSection />
            </MobileAccordion>

            <MobileAccordion title="Status">
              <ProductStatusWidget />
            </MobileAccordion>

            <MobileAccordion title="Tags">
              <ProductTagsInput />
            </MobileAccordion>

            <MobileAccordion title="Merchandising">
              <ProductAdvancedSection />
            </MobileAccordion>

            <MobileAccordion title="SEO">
              <ProductSEOSection />
            </MobileAccordion>

            {isEditMode && (
              <MobileAccordion title="Quick Actions">
                <ProductQuickActions
                  productId={initialData?.id}
                  slug={initialData?.slug}
                  productName={productName}
                  sku={sku || undefined}
                  barcode={barcode || undefined}
                />
              </MobileAccordion>
            )}
          </div>
        </div>

      </form>
    </FormProvider>
  );
}
