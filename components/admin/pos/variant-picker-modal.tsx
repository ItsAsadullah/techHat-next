'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { POSProduct } from '@/lib/actions/pos-actions';
import Image from 'next/image';

interface VariantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: POSProduct | null;
  onSelectVariant: (product: POSProduct, variantId: string) => void;
}

export function VariantPickerModal({ isOpen, onClose, product, onSelectVariant }: VariantPickerModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  if (!product) return null;

  const handleConfirm = () => {
    if (selectedVariantId) {
      onSelectVariant(product, selectedVariantId);
      setSelectedVariantId(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedVariantId(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Select Product Variant
          </DialogTitle>
        </DialogHeader>

        {/* Product Info */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{product.categoryName}</p>
              {product.sku && (
                <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>
              )}
            </div>
          </div>
        </div>

        {/* Variants Grid */}
        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto py-2">
          {product.variants.map((variant) => {
            const isSelected = selectedVariantId === variant.id;
            const isOutOfStock = variant.stock <= 0;
            const effectivePrice = variant.offerPrice || variant.price;

            return (
              <button
                key={variant.id}
                onClick={() => !isOutOfStock && setSelectedVariantId(variant.id)}
                disabled={isOutOfStock}
                className={cn(
                  'relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left',
                  isSelected && 'border-blue-600 bg-blue-50 shadow-md',
                  !isSelected && !isOutOfStock && 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
                  isOutOfStock && 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                )}
              >
                {/* Variant Image */}
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                  {variant.image ? (
                    <Image src={variant.image} alt={variant.name} fill className="object-cover" sizes="56px" />
                  ) : product.image ? (
                    <Image src={product.image} alt={variant.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Variant Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{variant.name}</p>
                  {variant.sku && (
                    <p className="text-xs text-gray-400 truncate">SKU: {variant.sku}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-black text-blue-600">
                      ৳{effectivePrice.toLocaleString()}
                    </span>
                    {variant.offerPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        ৳{variant.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {isOutOfStock ? (
                      <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0">
                        Out of Stock
                      </Badge>
                    ) : variant.stock < 10 ? (
                      <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0">
                        {variant.stock} left
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                        {variant.stock} in stock
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                    <X className="h-8 w-8 text-red-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedVariantId}
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
