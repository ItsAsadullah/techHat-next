import { prisma } from '@/lib/prisma';
import { getProducts, getInventoryStats } from '@/lib/actions/product-stock-actions';
import { getCachedCategories, getCachedBrands } from '@/lib/cache/cached-data';
import { StockSummary } from '@/components/admin/products/stock-summary';
import { ProductTableToolbar } from '@/components/admin/products/product-table-toolbar';
import { UnifiedProductTable } from '@/components/admin/products/unified-product-table';
import { columns } from '@/components/admin/products/product-columns';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Upload, Download, SlidersHorizontal } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Product Inventory Management',
  description: 'Manage products and stock levels',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  
  // Parse params
  const page = Number(resolvedSearchParams.page) || 1;
  const ALLOWED_LIMITS = [10, 20, 50, 100];
  const rawLimit = Number(resolvedSearchParams.limit);
  const limit = ALLOWED_LIMITS.includes(rawLimit) ? rawLimit : 20;
  const search = (resolvedSearchParams.search as string) || undefined;
  const categoryId = (resolvedSearchParams.category as string) || undefined;
  const brandId = (resolvedSearchParams.brand as string) || undefined;
  const stockStatus = (resolvedSearchParams.stock_status as string) as 'in' | 'low' | 'out' | undefined;
  const status = (resolvedSearchParams.status as string) as 'active' | 'draft' | 'inactive' | undefined;

  // Fetch Data in Parallel using cached data for categories/brands
  const [
    { products, total, totalPages },
    inventoryStats,
    categories,
    brands
  ] = await Promise.all([
    getProducts({
      page,
      limit,
      search,
      categoryId,
      brandId,
      stockStatus,
      status
    }),
    getInventoryStats(),
    getCachedCategories(),
    getCachedBrands()
  ]);

  // Transform products for table
  const formattedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    costPrice: p.costPrice,
    stock: p.stock,
    category: p.category.name,
    status: p.isActive,
    images: p.productImages,
    variants: p.variants,
    minStock: p.minStock,
    updatedAt: p.updatedAt,
    sku: p.sku
  }));

  return (
    <div className="p-8 min-h-screen bg-gray-50/50 dark:bg-gray-950 space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Products</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage your catalog, stock levels, and pricing strategy.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm font-medium">
                <Upload className="h-4 w-4" /> Import
            </Button>
            <Button variant="outline" className="gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm font-medium">
                <Download className="h-4 w-4" /> Export
            </Button>
            <Button asChild variant="outline" className="gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600 shadow-sm font-medium">
                <a href="#bulk-actions-bar" title="Select products in the table, then apply bulk actions">
                  <SlidersHorizontal className="h-4 w-4" /> Bulk Update
                </a>
            </Button>
            <Link href="/admin/products/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 font-semibold">
                    <Plus className="h-4 w-4 mr-2" /> Add New Product
                </Button>
            </Link>
        </div>
      </div>

      {/* Low Stock Alert Banner - Moved to top */}
      {inventoryStats.lowStock > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-white dark:from-amber-950/50 dark:to-gray-900 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-6 py-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-4">
                  <div className="bg-amber-100 dark:bg-amber-900/50 p-2.5 rounded-full ring-4 ring-amber-50 dark:ring-amber-900/20">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                  </div>
                  <div>
                      <span className="font-bold text-lg">{inventoryStats.lowStock} products needs restocking</span>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5 font-medium">Inventory levels are running low for these items.</p>
                  </div>
              </div>
              <Link 
                  href="/admin/products?stock_status=low" 
                  className="bg-white dark:bg-gray-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
              >
                  View Low Stock Items
              </Link>
          </div>
      )}

      <StockSummary stats={inventoryStats} />

      <div className="space-y-6">

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                 <ProductTableToolbar 
                    categories={categories} 
                    brands={brands} 
                />
            </div>
            <div className="p-0">
                <UnifiedProductTable 
                    columns={columns} 
                    data={formattedProducts} 
                    pageCount={totalPages}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
