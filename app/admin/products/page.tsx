import { getProducts, getInventoryStats } from '@/lib/actions/product-stock-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';
import { ProductTableToolbar } from "@/components/admin/products/product-table-toolbar";
import { UnifiedProductTable } from '@/components/admin/products/unified-product-table';
import { columns } from '@/components/admin/products/product-columns';
import { Metadata } from 'next';
import Link from 'next/link';
import { PackageSearch, AlertTriangle, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: 'Product Master Data',
  description: 'Manage master product records, pricing, and configurations',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams.page) || 1;
  const ALLOWED_LIMITS = [10, 20, 50, 100];
  const rawLimit = Number(resolvedSearchParams.limit);
  const limit = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 20;
  const search = (resolvedSearchParams.search as string) || undefined;
  const categoryId = (resolvedSearchParams.category as string) || undefined;
  const brandId = (resolvedSearchParams.brand as string) || undefined;
  const stockStatus = (resolvedSearchParams.stock_status as string) as
    | 'in'
    | 'low'
    | 'out'
    | undefined;
  const status = (resolvedSearchParams.status as string) as
    | 'active'
    | 'draft'
    | 'inactive'
    | undefined;

  const [
    { products, totalPages },
    inventoryStats,
    categories,
    brands,
  ] = await Promise.all([
    getProducts({ page, limit, search, categoryId, brandId, stockStatus, status }),
    getInventoryStats(),
    getCachedCategories(),
    getCachedBrands(),
  ]);

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    category: (p as any).category?.name || '',
    status: p.status || 'DRAFT',
    lifecycleStatus: p.status || 'DRAFT',
    images: (p as any).productImages || [],
    variants: (p as any).variants || [],
    minStock: p.minStock,
    updatedAt: p.updatedAt,
    sku: p.sku,
    slug: p.slug,
  }));


  return (
    <div className="bg-slate-50 dark:bg-zinc-950 w-full max-w-full overflow-x-hidden">

      {/* ══════════════════════════════════════════════════
          MOBILE HEADER
          Removed. The ProductTableToolbar acts as the 
          unified sticky header on mobile.
      ══════════════════════════════════════════════════ */}

      {/* ══════════════════════════════════════════════════
          DESKTOP HEADER (Extremely compact)
      ══════════════════════════════════════════════════ */}
      <header className="hidden md:flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Product Master Data
          </h1>
          {inventoryStats.lowStock > 0 && (
             <Link href="/admin/products?stock_status=low" className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 px-2.5 py-1 rounded-md text-xs font-semibold hover:bg-amber-100 transition-colors">
               <AlertTriangle className="w-3.5 h-3.5" />
               {inventoryStats.lowStock} items need restocking
             </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
          >
            Add Product
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT (Flush Layout)
      ══════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-zinc-950">
        <div className="sticky top-0 md:top-[61px] z-50 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 p-2 md:px-6 md:pt-4 md:pb-3">
          <ProductTableToolbar categories={categories} brands={brands} />
        </div>
        <div className="px-0 md:px-6">
          <UnifiedProductTable 
            columns={columns} 
            data={formattedProducts} 
            pageCount={totalPages}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MOBILE FLOATING ACTION BUTTON
          Solid, edge-to-edge or simple floating block
      ══════════════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 p-3">
        <Link href="/admin/products/new" className="block">
          <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white h-10 rounded-md font-semibold text-sm">
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </Link>
      </div>

    </div>
  );
}