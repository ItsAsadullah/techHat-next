import { getProduct } from '@/lib/actions/product-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-sm text-muted-foreground">SKU: {product.sku || 'N/A'}</p>
            </div>
          </div>
          <Link href={`/admin/products/edit/${id}`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" /> Edit Product
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={product.isActive ? 'default' : 'secondary'} className="mt-1">
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium mt-1">{product.category?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Brand</p>
                    <p className="font-medium mt-1">{product.brand?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unit</p>
                    <p className="font-medium mt-1">{product.unit || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory & Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cost Price</p>
                    <p className="font-medium font-mono mt-1">৳{product.costPrice}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Selling Price</p>
                    <p className="font-medium font-mono text-green-600 mt-1">৳{product.price}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Stock</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{product.stock}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Min Stock</p>
                    <p className="font-medium mt-1">{product.minStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Track Inventory</span>
                  <Badge variant="outline">{product.trackInventory ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Track Serials</span>
                  <Badge variant="outline">{product.trackSerials ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Track Batch</span>
                  <Badge variant="outline">{product.trackBatch ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Track Expiry</span>
                  <Badge variant="outline">{product.trackExpiry ? 'Yes' : 'No'}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Has Variants</span>
                  <Badge variant="outline">{product.productVariantType === 'variable' ? 'Yes' : 'No'}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
