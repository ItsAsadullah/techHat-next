'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

// Actions
import { createPurchaseOrder, updatePurchaseOrder, PurchaseOrderFormData, searchProductsForPO, updatePurchaseOrderStatus } from '@/lib/actions/po-actions';
import { getSupplierIntelligence, getAIAssistantRecommendations } from '@/lib/actions/supplier-intelligence';

// Subcomponents
import { WorkspaceHeader } from './WorkspaceHeader';
import { SupplierIntelligenceCard } from './SupplierIntelligenceCard';
import { SmartProductSelector } from './SmartProductSelector';
import { PurchaseTable } from './PurchaseTable';
import { IntelligenceSidebar } from './IntelligenceSidebar';
import { AIAssistantCard } from './AIAssistantCard';
import { PurchaseNotesCard } from './PurchaseNotesCard';

interface POFormProps {
  initialData?: any;
  isEditMode?: boolean;
  suppliers: any[];
  warehouses: any[];
}

export function PurchaseOrderForm({ initialData, isEditMode = false, suppliers, warehouses }: POFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Core Form State
  const [supplierId, setSupplierId] = useState(initialData?.supplierId || '');
  const [warehouseId, setWarehouseId] = useState(initialData?.warehouseId || '');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    initialData?.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split('T')[0] : ''
  );
  const [note, setNote] = useState(initialData?.note || '');
  const [status, setStatus] = useState<'DRAFT' | 'SUBMITTED' | 'APPROVED'>(initialData?.status || 'DRAFT');

  // Costs State
  const [shippingCost, setShippingCost] = useState<number>(initialData?.shippingCost || 0);
  const [otherCost, setOtherCost] = useState<number>(initialData?.otherCost || 0);
  const [globalDiscount, setGlobalDiscount] = useState<number>(initialData?.discount || 0);

  // Items State
  const [items, setItems] = useState<any[]>(
    initialData?.items?.map((item: any) => ({
      id: Math.random().toString(), // temporary UI id
      productId: item.productId,
      variantId: item.variantId || null,
      name: item.product?.name,
      variantName: item.variant?.name,
      sku: item.variant?.sku || item.product?.sku,
      quantity: item.quantity,
      unitCost: item.unitCost,
      discount: item.discount || 0,
      tax: item.tax || 0,
      currentStock: item.variant?.stock || item.product?.stock || 0,
      lastPurchaseCost: item.variant?.lastPurchaseCost || item.product?.lastPurchaseCost || 0,
      incomingStock: 0,
      reservedStock: item.product?.reservedStock || 0
    })) || []
  );

  // Intelligence State
  const [supplierIntell, setSupplierIntell] = useState<any>(null);
  const [aiRecs, setAiRecs] = useState<any>(null);
  const [isLoadingIntell, setIsLoadingIntell] = useState(false);

  // Derived Totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let itemDiscountTotal = 0;
    let totalTax = 0;

    const formattedItems = items.map(item => {
      const lineDiscount = (item.discount || 0) * item.quantity;
      const itemSubtotal = (item.quantity * item.unitCost) + (item.tax || 0) - lineDiscount;
      subtotal += (item.quantity * item.unitCost);
      itemDiscountTotal += lineDiscount;
      totalTax += (item.tax || 0);
      return { ...item, subtotal: itemSubtotal };
    });

    const grandTotal = subtotal + shippingCost + otherCost + totalTax - itemDiscountTotal - globalDiscount;

    return { subtotal, totalDiscount: itemDiscountTotal, totalTax, grandTotal, formattedItems };
  }, [items, shippingCost, otherCost, globalDiscount]);

  // Load Intelligence on Supplier Change
  useEffect(() => {
    if (!supplierId) {
      setSupplierIntell(null);
      setAiRecs(null);
      return;
    }
    const loadIntell = async () => {
      setIsLoadingIntell(true);
      const [intellRes, aiRes] = await Promise.all([
        getSupplierIntelligence(supplierId),
        getAIAssistantRecommendations(supplierId)
      ]);
      if (intellRes.success) setSupplierIntell(intellRes.data);
      if (aiRes.success) setAiRecs(aiRes.data);
      setIsLoadingIntell(false);
    };
    loadIntell();
  }, [supplierId]);

  const addProductToPO = (product: any, variant: any = null) => {
    // If added via AI recommendations (we only have IDs), we need full fetch. 
    // But for Smart Selector, we have the full product object.
    if (typeof product === 'string') {
      toast.info("Fetching product details...");
      searchProductsForPO(product).then(res => {
         if(res.success && res.data && res.data.length > 0) {
           const p = res.data[0];
           const v = variant ? p.variants.find((v:any)=>v.id===variant) : null;
           addProductToPO(p, v);
         }
      });
      return;
    }

    setItems(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.productId === (product.id || product) && 
        item.variantId === (variant ? variant.id : null)
      );

      if (existingItemIndex >= 0) {
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += 1;
        // Do not call toast inside the state updater to avoid rendering issues
        setTimeout(() => toast.success('Increased quantity.'), 0);
        return newItems;
      }

      return [
        ...prev,
        {
          id: Math.random().toString(),
          productId: product.id,
          variantId: variant ? variant.id : null,
          name: product.name,
          variantName: variant ? variant.name : null,
          sku: variant ? variant.sku : product.sku,
          quantity: 1,
          unitCost: variant ? (variant.costPrice || product.costPrice || 0) : (product.costPrice || 0),
          discount: 0,
          tax: 0,
          currentStock: variant ? variant.stock : product.stock,
          lastPurchaseCost: variant ? variant.lastPurchaseCost : product.lastPurchaseCost,
          incomingStock: variant ? variant.incomingStock : product.incomingStock,
          reservedStock: product.reservedStock || 0,
          image: variant?.images?.[0]?.url || product?.images?.[0]?.url || null
        }
      ];
    });
  };

  const updateItem = (id: string, field: string, value: number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (submitStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED') => {
    if (!supplierId) return toast.error('Please select a supplier.');
    if (items.length === 0) return toast.error('Please add at least one item to the PO.');

    setLoading(true);

    try {
      const payload: PurchaseOrderFormData = {
        supplierId,
        warehouseId: warehouseId || undefined,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        totalAmount: totals.subtotal,
        discount: globalDiscount,
        tax: totals.totalTax,
        shippingCost,
        otherCost,
        grandTotal: totals.grandTotal,
        note,
        items: totals.formattedItems.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          unitCost: i.unitCost,
          discount: i.discount,
          tax: i.tax,
          subtotal: i.subtotal,
        }))
      };

      let res;
      if (isEditMode && initialData?.id) {
        res = await updatePurchaseOrder(initialData.id, payload);
        if (res.success && submitStatus !== 'DRAFT' && submitStatus !== status) {
          await updatePurchaseOrderStatus(initialData.id, submitStatus);
        }
      } else {
        res = await createPurchaseOrder(payload);
        if (res.success && res.data && submitStatus !== 'DRAFT') {
           await updatePurchaseOrderStatus(res.data.id, submitStatus);
        }
      }

      if (res.success) {
        toast.success(`Purchase Order ${submitStatus.toLowerCase()}!`);
        router.push('/admin/purchases');
      } else {
        toast.error(res.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit form.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-24">
      <WorkspaceHeader 
        isEditMode={isEditMode} 
        poNumber={initialData?.poNumber} 
        status={status} 
        loading={loading} 
        onDiscard={() => router.back()} 
        onSubmit={handleSubmit} 
      />

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Workspace (70%) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            
            {/* Core Details Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Supplier <span className="text-red-500">*</span></Label>
                  <Select value={supplierId} onValueChange={setSupplierId} disabled={isEditMode && status !== 'DRAFT'}>
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Select supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Delivery</Label>
                  <Input type="date" className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} disabled={status !== 'DRAFT'} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Warehouse</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId} disabled={status !== 'DRAFT'}>
                    <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder="Select warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map(w => (
                        <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {status === 'DRAFT' && (
              <SmartProductSelector 
                searchProducts={searchProductsForPO} 
                onAddProduct={addProductToPO} 
                addedItems={items} 
              />
            )}

            <PurchaseTable 
              items={totals.formattedItems} 
              updateItem={updateItem} 
              removeItem={removeItem} 
            />

            {supplierId && status === 'DRAFT' && (
              <AIAssistantCard 
                recommendations={aiRecs} 
                isLoading={isLoadingIntell} 
                onAddProduct={addProductToPO} 
              />
            )}

            <PurchaseNotesCard note={note} setNote={setNote} />

          </div>

          {/* Intelligence Sidebar (30%) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-[100px] space-y-6">
              {supplierId && <SupplierIntelligenceCard intelligence={supplierIntell} isLoading={isLoadingIntell} />}
              <IntelligenceSidebar 
                totals={totals}
                shippingCost={shippingCost}
                setShippingCost={setShippingCost}
                otherCost={otherCost}
                setOtherCost={setOtherCost}
                globalDiscount={globalDiscount}
                setGlobalDiscount={setGlobalDiscount}
                intelligence={supplierIntell}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
