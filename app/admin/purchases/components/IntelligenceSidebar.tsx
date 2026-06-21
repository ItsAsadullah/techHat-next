import { Calculator, BarChart3, Clock, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface IntelligenceSidebarProps {
  totals: {
    subtotal: number;
    totalDiscount: number;
    totalTax: number;
    grandTotal: number;
    formattedItems: any[];
  };
  shippingCost: number;
  setShippingCost: (val: number) => void;
  otherCost: number;
  setOtherCost: (val: number) => void;
  globalDiscount: number;
  setGlobalDiscount: (val: number) => void;
  intelligence: any;
}

export function IntelligenceSidebar({ totals, shippingCost, setShippingCost, otherCost, setOtherCost, globalDiscount, setGlobalDiscount, intelligence }: IntelligenceSidebarProps) {
  
  const totalItemsCount = totals.formattedItems.reduce((acc, item) => acc + item.quantity, 0);

  // --- LIVE LANDED COST CALCULATION ---
  let poTotalBaseValue = 0;
  totals.formattedItems.forEach(item => {
    const perUnitDiscount = item.quantity > 0 ? (item.discount || 0) / item.quantity : 0;
    const netUnitCost = item.unitCost - perUnitDiscount;
    poTotalBaseValue += (item.quantity * netUnitCost);
  });

  const globalExtraCost = (shippingCost || 0) + (otherCost || 0) - (globalDiscount || 0);
  const landedCostMultiplier = poTotalBaseValue > 0 ? (poTotalBaseValue + globalExtraCost) / poTotalBaseValue : 1;

  return (
    <div className="space-y-6">
      
      {/* Order Summary */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Order Summary
        </h2>
        
        <div className="space-y-3.5 text-sm">
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono text-gray-900 dark:text-gray-100 font-medium">৳{totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-red-500">
            <span>Item Discount</span>
            <span className="font-mono font-medium">-৳{totals.totalDiscount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
            <span>Tax Total</span>
            <span className="font-mono font-medium text-gray-900 dark:text-gray-100">+৳{totals.totalTax.toLocaleString()}</span>
          </div>
          
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shipping Cost (+)</Label>
              <Input 
                type="number" min="0" step="0.01" 
                className="h-10 font-mono bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Costs (+)</Label>
              <Input 
                type="number" min="0" step="0.01" 
                className="h-10 font-mono bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                value={otherCost}
                onChange={(e) => setOtherCost(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-xs font-semibold text-red-500 uppercase tracking-wider">Global Discount (-)</Label>
              <Input 
                type="number" min="0" step="0.01" 
                className="h-10 font-mono bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-600 focus-visible:ring-red-500"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center font-bold text-xl pt-5 mt-5 border-t border-gray-200 dark:border-gray-800">
            <span className="text-gray-900 dark:text-gray-100">Grand Total</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400">৳{totals.grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Purchase Analytics */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Purchase Analytics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Total SKUs</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totals.formattedItems.length}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] uppercase text-gray-500 font-semibold mb-1">Total Units</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalItemsCount}</p>
          </div>
          <div className="col-span-2 mt-2 space-y-3">
            <p className="text-[10px] uppercase text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800 pb-1 flex justify-between">
              <span>Landed Cost Breakdown</span>
              <DollarSign className="w-3 h-3 text-emerald-500" />
            </p>
            {totals.formattedItems.length > 0 ? (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {totals.formattedItems.map((item, idx) => {
                  const perUnitDiscount = item.quantity > 0 ? (item.discount || 0) / item.quantity : 0;
                  const netUnitCost = item.unitCost - perUnitDiscount;
                  const landedUnitCost = netUnitCost * landedCostMultiplier;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                      <span className="truncate w-3/5 font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        ৳{landedUnitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}<span className="text-[9px] text-gray-400 font-normal">/pc</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Add items to see landed cost</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {intelligence?.recentPOs && intelligence.recentPOs.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-5 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Recent Activity
          </h2>
          <div className="space-y-4">
            {intelligence.recentPOs.map((po: any) => (
              <div key={po.id} className="flex justify-between items-center text-sm">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{po.poNumber}</p>
                  <p className="text-[10px] text-gray-500">{new Date(po.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-medium text-gray-900 dark:text-gray-100">৳{po.totalAmount.toLocaleString()}</p>
                  <p className={`text-[10px] font-bold ${po.status === 'APPROVED' ? 'text-emerald-500' : 'text-gray-500'}`}>{po.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
