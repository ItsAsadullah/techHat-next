import { getProduct } from '@/lib/actions/product-actions';
import { getProductFullTimeline, getProductInventorySnapshot } from '@/lib/actions/product-enterprise-actions';
import { getProductPurchaseHistory, getProductGRNHistory } from '@/lib/actions/product-history-actions';
import { getLedgerForProduct } from '@/lib/actions/ledger-viewer-actions';
import { ProductPurchaseHistory, ProductGRNHistory } from '@/components/admin/products/product-history-tabs';
import { ProductLedgerHistory } from '@/components/admin/products/product-ledger-history';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, ArrowLeft, ExternalLink, Package, CheckCircle2, XCircle, AlertTriangle, Clock, Tag } from 'lucide-react';
import { statusConfig } from '@/components/admin/products/product-form/schemas/product.schema';
import { formatDistanceToNow } from 'date-fns';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return {
    title: product ? `${product.name} — Product Details` : 'Product Not Found',
  };
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b last:border-b-0 gap-4">
      <span className="text-sm text-muted-foreground shrink-0 w-36">{label}</span>
      <span className="text-sm font-medium text-right">{value || <span className="text-muted-foreground/50">—</span>}</span>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return value
    ? <span className="flex items-center gap-1 text-emerald-600 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Enabled</span>
    : <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle className="h-3.5 w-3.5" />Disabled</span>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const [product, inventory, history, purchaseData, grnData, ledgerData] = await Promise.all([
    getProduct(id),
    getProductInventorySnapshot(id),
    getProductFullTimeline(id),
    getProductPurchaseHistory(id),
    getProductGRNHistory(id),
    getLedgerForProduct(id, "", 50),
  ]);

  if (!product) notFound();

  const p = product as any;
  const status = p.status || 'DRAFT';
  const statusCfg = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
  const thumbnail = p.productImages?.find((i: any) => i.isThumbnail) ?? p.productImages?.[0];
  const specs = p.specs || [];
  const variants = p.variants || [];

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/products">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-base tracking-tight truncate max-w-[300px] md:max-w-[600px]">{p.name}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {p.sku && <span className="font-mono">{p.sku}</span>}
                <span>•</span>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {p.slug && (
              <Link href={`/products/${p.slug}`} target="_blank">
                <Button variant="outline" size="sm" className="h-8 text-xs hidden md:flex">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Preview
                </Button>
              </Link>
            )}
            <Link href={`/admin/products/edit/${id}`}>
              <Button size="sm" className="h-8">
                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <Tabs defaultValue="overview" className="space-y-4">

          {/* ── Tab List ── */}
          <TabsList className="bg-card border h-9 p-0.5 gap-0.5 overflow-x-auto flex-nowrap w-full justify-start md:w-auto overflow-y-hidden">
            {['overview', 'specifications', 'variants', 'inventory', 'purchases', 'ledger', 'timeline'].map((tab) => (
              <TabsTrigger key={tab} value={tab} className="h-8 px-4 text-xs capitalize whitespace-nowrap">
                {tab === 'overview' ? 'Overview' :
                 tab === 'specifications' ? 'Specs' :
                 tab === 'variants' ? `Variants (${variants.length})` :
                 tab === 'inventory' ? 'Inventory' : 
                 tab === 'purchases' ? 'Purchases & GRN' :
                 tab === 'ledger' ? 'Stock Ledger' : 'Timeline'}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ════════════════════════════════
              TAB 1: OVERVIEW
          ════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Left: Media + Identity */}
              <div className="md:col-span-8 space-y-4">
                {/* Product Hero */}
                <div className="bg-card border rounded-lg p-5 flex gap-5">
                  <div className="w-24 h-24 shrink-0 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                    {thumbnail ? (
                      <Image src={thumbnail.url} alt={p.name} width={96} height={96} className="object-cover w-full h-full" />
                    ) : (
                      <Package className="h-8 w-8 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-lg leading-tight">{p.name}</h2>
                    {p.brand?.name && <p className="text-sm text-muted-foreground">{p.brand.name} {p.model && `• ${p.model}`}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(p.tags || []).map((tag: string) => (
                        <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs">
                          <Tag className="h-2.5 w-2.5" />{tag}
                        </span>
                      ))}
                    </div>
                    {p.shortDesc && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.shortDesc}</p>}
                  </div>
                </div>

                {/* Core Details */}
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b bg-muted/20">
                    <h3 className="text-sm font-semibold">Product Details</h3>
                  </div>
                  <div className="px-5">
                    <InfoRow label="Category" value={p.category?.name} />
                    <InfoRow label="Brand" value={p.brand?.name} />
                    <InfoRow label="Model" value={p.model} />
                    <InfoRow label="SKU" value={p.sku && <span className="font-mono text-xs">{p.sku}</span>} />
                    <InfoRow label="Barcode" value={p.barcode && <span className="font-mono text-xs">{p.barcode}</span>} />
                    <InfoRow label="Unit" value={p.unit} />
                    <InfoRow label="Warranty" value={p.warrantyMonths ? `${p.warrantyMonths} months${p.warrantyType ? ` (${p.warrantyType})` : ''}` : null} />
                    <InfoRow label="Product Type" value={p.productVariantType === 'variable' ? 'Variable' : 'Simple'} />
                    <InfoRow label="Status" value={
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    } />
                  </div>
                </div>

                {/* Pricing */}
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="px-5 py-3 border-b bg-muted/20">
                    <h3 className="text-sm font-semibold">Pricing</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x">
                    {[
                      { label: 'Retail', value: p.price, highlight: true },
                      { label: 'Offer', value: p.offerPrice },
                      { label: 'Online', value: p.onlinePrice },
                      { label: 'Wholesale', value: p.wholesalePrice },
                    ].map(({ label, value, highlight }) => (
                      <div key={label} className="p-4 text-center">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className={`text-lg font-mono font-semibold mt-1 ${highlight ? 'text-emerald-600' : ''}`}>
                          {value != null ? `৳${Number(value).toFixed(0)}` : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Status sidebar */}
              <div className="md:col-span-4 space-y-4">
                {/* Status */}
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/20">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lifecycle</h3>
                  </div>
                  <div className="p-4">
                    <div className={`px-3 py-2.5 rounded-lg ${statusCfg.bg}`}>
                      <p className={`font-semibold text-sm ${statusCfg.color}`}>{statusCfg.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{statusCfg.description}</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Store Visible</span>
                        <BoolBadge value={p.status === 'ACTIVE'} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Featured</span>
                        <BoolBadge value={p.isFeatured} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Best Seller</span>
                        <BoolBadge value={p.isBestSeller} />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Flash Sale</span>
                        <BoolBadge value={p.isFlashSale} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tracking Config */}
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/20">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Inventory Config</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {[
                      { label: 'Track Inventory', value: p.trackInventory },
                      { label: 'Track Serials', value: p.trackSerials },
                      { label: 'Track Batch', value: p.trackBatch },
                      { label: 'Track Expiry', value: p.trackExpiry },
                      { label: 'Track Warranty', value: p.trackWarranty },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <BoolBadge value={value} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-card border rounded-lg overflow-hidden">
                  <div className="px-4 py-2.5 border-b bg-muted/20">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timestamps</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{p.createdAt ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true }) : '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Updated</span>
                      <span className="font-medium">{p.updatedAt ? formatDistanceToNow(new Date(p.updatedAt), { addSuffix: true }) : '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery */}
            {p.productImages?.length > 0 && (
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="px-5 py-3 border-b bg-muted/20">
                  <h3 className="text-sm font-semibold">Gallery ({p.productImages.length})</h3>
                </div>
                <div className="p-4 grid grid-cols-4 md:grid-cols-8 gap-2">
                  {p.productImages.map((img: any) => (
                    <div key={img.id} className="aspect-square rounded border overflow-hidden bg-muted relative">
                      <Image src={img.url} alt="Product" fill className="object-cover" sizes="80px" />
                      {img.isThumbnail && (
                        <div className="absolute top-0.5 left-0.5 bg-yellow-400 text-black text-[8px] px-0.5 py-px rounded leading-tight font-bold">MAIN</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ════════════════════════════════
              TAB 2: SPECIFICATIONS
          ════════════════════════════════ */}
          <TabsContent value="specifications" className="mt-0">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/20">
                <h3 className="text-sm font-semibold">Technical Specifications ({specs.length})</h3>
              </div>
              {specs.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">No specifications added yet.</div>
              ) : (
                <div className="divide-y">
                  {specs.map((spec: any, i: number) => (
                    <div key={spec.id || i} className="flex items-start px-5 py-3">
                      <span className="text-sm text-muted-foreground w-48 shrink-0">{spec.name}</span>
                      <span className="text-sm font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attributes from JSON */}
            {p.attributes && Array.isArray(p.attributes) && p.attributes.length > 0 && (
              <div className="bg-card border rounded-lg overflow-hidden mt-4">
                <div className="px-5 py-3 border-b bg-muted/20">
                  <h3 className="text-sm font-semibold">Attributes</h3>
                </div>
                <div className="p-4 flex flex-wrap gap-2">
                  {p.attributes.map((attr: any) => (
                    <div key={attr.id || attr.name} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{attr.name}</p>
                      <div className="flex flex-wrap gap-1">
                        {(attr.values || []).map((v: string) => (
                          <Badge key={v} variant="secondary" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ════════════════════════════════
              TAB 3: VARIANTS
          ════════════════════════════════ */}
          <TabsContent value="variants" className="mt-0">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/20 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Variant Matrix</h3>
                <Badge variant="outline">{variants.length} variants</Badge>
              </div>
              {variants.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  {p.productVariantType === 'simple' ? 'Simple product — no variants.' : 'No variants configured.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Variant</th>
                        <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">SKU</th>
                        <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Barcode</th>
                        <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Price</th>
                        <th className="text-right px-4 py-2.5 font-medium text-xs text-muted-foreground">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {variants.map((v: any) => (
                        <tr key={v.id} className="hover:bg-muted/20">
                          <td className="px-4 py-2.5 font-medium">{v.name}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{v.sku || '—'}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{v.upc || '—'}</td>
                          <td className="px-4 py-2.5 text-right font-mono">৳{Number(v.price).toFixed(0)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              v.stock <= 0 ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                              v.stock <= (v.minStock ?? 5) ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            }`}>
                              {v.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ════════════════════════════════
              TAB 4: INVENTORY (Read-only)
          ════════════════════════════════ */}
          <TabsContent value="inventory" className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Physical Stock', value: inventory?.totalStock ?? 0, color: 'text-blue-600' },
                { label: 'Available', value: inventory?.availableStock ?? 0, color: 'text-emerald-600' },
                { label: 'Reserved', value: inventory?.reservedStock ?? 0, color: 'text-orange-600' },
                { label: 'Incoming', value: inventory?.incomingStock ?? 0, color: 'text-purple-600' },
                { label: 'Damaged', value: inventory?.damagedStock ?? 0, color: 'text-red-600' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-card border rounded-lg p-4 text-center flex flex-col justify-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-3xl font-bold font-mono mt-1 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Reorder thresholds */}
            <div className="bg-card border rounded-lg overflow-hidden mt-4">
              <div className="px-5 py-3 border-b bg-muted/20">
                <h3 className="text-sm font-semibold">Reorder Configuration</h3>
              </div>
              <div className="px-5">
                <InfoRow label="Safety Stock" value={`${(p as any).safetyStock ?? 0} units`} />
                <InfoRow label="Reorder Point" value={`${p.reorderPoint ?? 10} units`} />
                <InfoRow label="Reorder Quantity" value={`${(p as any).reorderQty ?? 0} units`} />
                <InfoRow label="Lead Time" value={`${(p as any).leadTimeDays ?? 0} days`} />
              </div>
            </div>

            {/* Stock status alert */}
            {inventory?.isOutOfStock && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mt-4">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Out of Stock</p>
                  <p className="text-xs text-red-600 dark:text-red-400">Stock replenishment required. Update via Purchase Module.</p>
                </div>
              </div>
            )}
            {inventory?.isLowStock && !inventory?.isOutOfStock && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 mt-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Low Stock Warning</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Stock is below minimum threshold. Consider reordering.</p>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4 italic">
              Stock quantities are read-only here. Use the Purchase Module to add stock.
            </p>
          </TabsContent>

          {/* ════════════════════════════════
              TAB 5: PURCHASES & GRN
          ════════════════════════════════ */}
          <TabsContent value="purchases" className="mt-0 space-y-6">
            <ProductPurchaseHistory poItems={purchaseData?.data || []} />
            <ProductGRNHistory grnItems={grnData?.data || []} />
          </TabsContent>

          {/* ════════════════════════════════
              TAB 6: STOCK LEDGER
          ════════════════════════════════ */}
          <TabsContent value="ledger" className="mt-0">
            <ProductLedgerHistory ledgerEntries={ledgerData || []} />
          </TabsContent>

          {/* ════════════════════════════════
              TAB 7: TIMELINE (Audit Log)
          ════════════════════════════════ */}
          <TabsContent value="timeline" className="mt-0">
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/20">
                <h3 className="text-sm font-semibold">Change History</h3>
              </div>
              {history.events.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No history recorded yet.</div>
              ) : (
                <div className="divide-y">
                  {history.events.map((log: any) => (
                    <div key={log.id} className="px-5 py-3 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">{log.type}</Badge>
                            <span className="text-sm font-medium capitalize">{String(log.action).replace(/_/g, ' ')}</span>
                            {log.user && (
                              <span className="text-xs text-muted-foreground">by {log.user}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(log.date), { addSuffix: true })}
                          </span>
                        </div>
                        {log.description && <p className="text-xs text-muted-foreground mt-1">{log.description}</p>}
                        {log.details && (
                          <div className="mt-2 p-2 bg-muted/30 rounded border text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
