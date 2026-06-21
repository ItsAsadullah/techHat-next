import { Building2, AlertTriangle, TrendingUp, TrendingDown, Star, Phone, Mail, Calendar, CircleDollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SupplierIntelligenceProps {
  intelligence: any;
  isLoading: boolean;
}

export function SupplierIntelligenceCard({ intelligence, isLoading }: SupplierIntelligenceProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-900 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!intelligence) return null;

  const {
    creditLimit, rating, riskScore, outstandingPayable, 
    lastPurchaseDate, totalPurchaseValue, purchaseFrequency,
    contactPerson, phone, email
  } = intelligence;

  const isHighRisk = riskScore > 70;
  const isOverLimit = outstandingPayable > creditLimit && creditLimit > 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50 shrink-0">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">Supplier Intelligence</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground mt-0.5">
              {contactPerson && <span className="flex items-center gap-1"><Building2 className="w-2.5 h-2.5"/> {contactPerson}</span>}
              {phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5"/> {phone}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {rating > 0 && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-500 dark:border-yellow-900/50">
              <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" /> {rating.toFixed(1)}
            </Badge>
          )}
          {isHighRisk && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-500 dark:border-red-900/50">
              <AlertTriangle className="w-2.5 h-2.5" /> Risk
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-50 dark:bg-gray-900/40 rounded p-2 border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Outstanding</p>
          <div className="flex items-end justify-between mt-0.5">
            <p className={`text-sm font-bold font-mono ${isOverLimit ? 'text-red-600' : 'text-gray-900 dark:text-gray-100'}`}>
              ৳{outstandingPayable.toLocaleString()}
            </p>
            {creditLimit > 0 && <span className="text-[9px] text-muted-foreground mb-0.5">/ ৳{creditLimit/1000}k</span>}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded p-2 border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Purchases</p>
          <div className="flex items-end justify-between mt-0.5">
            <p className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
              ৳{totalPurchaseValue.toLocaleString()}
            </p>
            <span className="text-[9px] text-muted-foreground mb-0.5">{purchaseFrequency} ord.</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded p-2 border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Last Order</p>
          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {lastPurchaseDate ? formatDistanceToNow(new Date(lastPurchaseDate)) + ' ago' : 'Never'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/40 rounded p-2 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Risk Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className={`text-xs font-bold font-mono ${riskScore > 70 ? 'text-red-600' : riskScore > 40 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                {riskScore}/100
              </p>
              {riskScore > 70 ? <TrendingUp className="w-3 h-3 text-red-500" /> : <TrendingDown className="w-3 h-3 text-emerald-500" />}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="relative flex h-2 w-2 mt-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
