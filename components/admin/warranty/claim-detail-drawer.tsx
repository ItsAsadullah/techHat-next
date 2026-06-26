'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Package, User, Phone, Hash, Calendar, Tag, ChevronRight, Truck, PackageCheck, CheckCircle2, XOctagon, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SendToSupplierDialog } from './send-to-supplier-dialog';
import { ReceiveFromSupplierDialog } from './receive-from-supplier-dialog';
import { DeliverToCustomerDialog } from './deliver-to-customer-dialog';
import { CancelClaimDialog } from './cancel-claim-dialog';
import { markReadyForCustomer } from '@/lib/actions/warranty-actions';
import { toast } from 'sonner';

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  RECEIVED:               { label: 'Received',             color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200',   icon: Package     },
  SENT_TO_SUPPLIER:       { label: 'Sent to Supplier',     color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: Truck      },
  RECEIVED_FROM_SUPPLIER: { label: 'Received from Supplier', color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200', icon: PackageCheck },
  READY_FOR_CUSTOMER:     { label: 'Ready for Customer',   color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200',   icon: CheckCircle2 },
  CLOSED:                 { label: 'Closed',               color: 'text-slate-600',  bg: 'bg-slate-100 border-slate-200', icon: CheckCircle2 },
  CANCELLED:              { label: 'Cancelled',             color: 'text-red-700',   bg: 'bg-red-50 border-red-200',    icon: XOctagon    },
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ClaimDetailDrawerProps {
  claim: any;
  onClose: () => void;
  onRefresh: () => void;
}

// ─── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide shrink-0">{label}</span>
      <span className={cn('text-xs font-bold text-slate-800 text-right leading-snug', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function ClaimDetailDrawer({ claim, onClose, onRefresh }: ClaimDetailDrawerProps) {
  const [showSendSupplier, setShowSendSupplier] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [showDeliver, setShowDeliver] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [markingReady, setMarkingReady] = useState(false);

  const statusCfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.RECEIVED;
  const StatusIcon = statusCfg.icon;
  const timeline: any[] = Array.isArray(claim.timeline) ? claim.timeline : [];
  const supplierData = claim.supplierWarranty as any;
  const accessoriesReceived: string[] = Array.isArray(claim.accessoriesReceived) ? claim.accessoriesReceived : [];
  const accessoriesMissing: string[] = Array.isArray(claim.accessoriesMissing) ? claim.accessoriesMissing : [];

  const handleMarkReady = async () => {
    setMarkingReady(true);
    const res = await markReadyForCustomer(claim.id);
    setMarkingReady(false);
    if (res.success) { toast.success('Marked as Ready for Customer.'); onRefresh(); }
    else toast.error(res.error || 'Failed.');
  };

  const handleSuccess = () => { onRefresh(); };

  // Days since created
  const daysSince = Math.floor((Date.now() - new Date(claim.createdAt).getTime()) / 86400000);

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">

        {/* ── Header ── */}
        <div className="shrink-0 border-b border-slate-200 p-5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-slate-900 font-mono">{claim.claimNumber}</span>
              <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1', statusCfg.color, statusCfg.bg)}>
                <StatusIcon className="w-3 h-3" />{statusCfg.label}
              </span>
              {daysSince > 0 && (
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', daysSince > 7 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600')}>
                  {daysSince}d ago
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">{claim.product?.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Product + Customer */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Product & Customer</p>
            <InfoRow label="Product" value={claim.product?.name} />
            <InfoRow label="Brand" value={claim.product?.brand?.name} />
            <InfoRow label="Variant" value={claim.variant?.name || claim.variant?.sku} />
            <InfoRow label="Serial" value={claim.serialNumber} mono />
            <InfoRow label="IMEI" value={claim.imei} mono />
            <InfoRow label="Invoice" value={claim.order?.orderNumber} mono />
            <InfoRow label="Customer" value={claim.order?.customerName} />
            <InfoRow label="Phone" value={claim.order?.customerPhone} mono />
            <InfoRow label="Purchase Date" value={claim.purchaseDate ? new Date(claim.purchaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
            <InfoRow label="Warranty" value={claim.warrantyType} />
            <InfoRow label="Warranty Expiry" value={claim.warrantyExpiry ? new Date(claim.warrantyExpiry).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null} />
          </div>

          {/* Issue */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue</p>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-bold text-[10px] uppercase">{claim.issueCategory}</Badge>
              <span className="text-[11px] text-slate-500 font-medium">Condition: {claim.condition}</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{claim.issueDescription}</p>
            {claim.technicianNotes && (
              <p className="text-[11px] text-slate-500 italic">Remarks: {claim.technicianNotes}</p>
            )}
          </div>

          {/* Accessories */}
          {(accessoriesReceived.length > 0 || accessoriesMissing.length > 0) && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accessories</p>
              <div className="flex flex-wrap gap-1.5">
                {accessoriesReceived.map(a => (
                  <span key={a} className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">✓ {a}</span>
                ))}
                {accessoriesMissing.map(a => (
                  <span key={a} className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full">✗ {a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Data (when applicable) */}
          {supplierData && supplierData.supplierName && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-1">
              <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-2">Supplier Details</p>
              <InfoRow label="Supplier" value={supplierData.supplierName} />
              <InfoRow label="Courier" value={supplierData.courierCompany} />
              <InfoRow label="Tracking" value={supplierData.trackingNumber} mono />
              <InfoRow label="Dispatched" value={supplierData.dispatchDate} />
              <InfoRow label="Est. Return" value={supplierData.estimatedReturnDate} />
              <InfoRow label="Out Cost" value={supplierData.outgoingCourierCost ? `৳${supplierData.outgoingCourierCost}` : null} />
              {supplierData.returnCondition && (
                <>
                  <InfoRow label="Return Condition" value={supplierData.returnCondition} />
                  <InfoRow label="In Cost" value={supplierData.incomingCourierCost ? `৳${supplierData.incomingCourierCost}` : null} />
                </>
              )}
              {(supplierData.outgoingCourierCost || supplierData.incomingCourierCost) && (
                <div className="pt-2 border-t border-orange-200 flex justify-between">
                  <span className="text-[11px] font-bold text-orange-700">Total Courier Cost</span>
                  <span className="text-[11px] font-black text-orange-800">
                    ৳{((supplierData.outgoingCourierCost || 0) + (supplierData.incomingCourierCost || 0)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline</p>
            <div className="space-y-0">
              {timeline.map((entry, i) => {
                const isLast = i === timeline.length - 1;
                const cfg = STATUS_CONFIG[entry.status];
                return (
                  <div key={i} className="flex gap-3 relative">
                    {!isLast && <div className="absolute left-3.5 top-8 bottom-0 w-0.5 bg-slate-100" />}
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 relative z-10">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-bold text-slate-700">{cfg?.label || entry.status.replace(/_/g, ' ')}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(entry.date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{entry.note}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">by {entry.user}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Action Footer ── */}
        {!['CLOSED', 'CANCELLED'].includes(claim.status) && (
          <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-4 space-y-2">
            {claim.status === 'RECEIVED' && (
              <Button onClick={() => setShowSendSupplier(true)} className="w-full h-12 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-200">
                <Truck className="w-4 h-4 mr-2" /> Send to Supplier
              </Button>
            )}
            {claim.status === 'SENT_TO_SUPPLIER' && (
              <Button onClick={() => setShowReceive(true)} className="w-full h-12 rounded-xl font-bold text-sm bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200">
                <PackageCheck className="w-4 h-4 mr-2" /> Receive from Supplier
              </Button>
            )}
            {claim.status === 'RECEIVED_FROM_SUPPLIER' && (
              <Button onClick={handleMarkReady} disabled={markingReady} className="w-full h-12 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-200">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Ready for Customer
              </Button>
            )}
            {claim.status === 'READY_FOR_CUSTOMER' && (
              <Button onClick={() => setShowDeliver(true)} className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Deliver to Customer
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => setShowCancel(true)}
              className="w-full h-9 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
            >
              <XOctagon className="w-3.5 h-3.5 mr-1.5" /> Cancel Claim
            </Button>
          </div>
        )}
      </div>

      {/* Action Dialogs */}
      {showSendSupplier && <SendToSupplierDialog claim={claim} open={showSendSupplier} onClose={() => setShowSendSupplier(false)} onSuccess={handleSuccess} />}
      {showReceive && <ReceiveFromSupplierDialog claim={claim} open={showReceive} onClose={() => setShowReceive(false)} onSuccess={handleSuccess} />}
      {showDeliver && <DeliverToCustomerDialog claim={claim} open={showDeliver} onClose={() => setShowDeliver(false)} onSuccess={handleSuccess} />}
      {showCancel && <CancelClaimDialog claim={claim} open={showCancel} onClose={() => setShowCancel(false)} onSuccess={handleSuccess} />}
    </>
  );
}
