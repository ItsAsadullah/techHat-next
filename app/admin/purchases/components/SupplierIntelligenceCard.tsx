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
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 shadow-sm">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/50">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Supplier Intelligence</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
              {contactPerson && <span className="flex items-center gap-1"><Building2 className="w-3 h-3"/> {contactPerson}</span>}
              {phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {phone}</span>}
              {email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {email}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rating > 0 && (
            <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-500 dark:border-yellow-900/50">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {rating.toFixed(1)}
            </Badge>
          )}
          {isHighRisk && (
            <Badge variant="outline" className="gap-1 bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-500 dark:border-red-900/50">
              <AlertTriangle className="w-3 h-3" /> High Risk
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Outstanding</p>
          <p className={`text-lg font-bold font-mono ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
            ৳{outstandingPayable.toLocaleString()}
          </p>
          {creditLimit > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">Limit: ৳{creditLimit.toLocaleString()}</p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Purchases</p>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100">
            ৳{totalPurchaseValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{purchaseFrequency} Orders</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Last Purchase</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {lastPurchaseDate ? new Date(lastPurchaseDate).toLocaleDateString() : 'Never'}
          </p>
          {lastPurchaseDate && (
            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDistanceToNow(new Date(lastPurchaseDate))} ago
            </p>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Status</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Preferred</span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800 col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Risk Score</p>
          <div className="mt-1 flex items-end gap-2">
            <p className={`text-lg font-bold font-mono ${riskScore > 70 ? 'text-red-600' : riskScore > 40 ? 'text-yellow-600' : 'text-emerald-600'}`}>
              {riskScore}/100
            </p>
            {riskScore > 70 ? <TrendingUp className="w-4 h-4 text-red-500 mb-1" /> : <TrendingDown className="w-4 h-4 text-emerald-500 mb-1" />}
          </div>
        </div>
      </div>
    </div>
  );
}
