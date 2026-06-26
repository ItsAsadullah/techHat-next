'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  X, ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2,
  Printer, MessageSquare, Mail, Warehouse, Sparkles, Search,
  Scan, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductFinder } from '@/components/admin/shared/product-finder';
import { ProductSummaryCard } from './product-summary-card';
import { HistorySidebar } from './history-sidebar';
import { StepIssue } from './step-issue';
import { StepInspection } from './step-inspection';
import { StepDecision } from './step-decision';

// ── Step Config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Product',     short: '1' },
  { id: 2, label: 'Issue',       short: '2' },
  { id: 3, label: 'Inspection',  short: '3' },
  { id: 4, label: 'Decision',    short: '4' },
  { id: 5, label: 'Complete',    short: '✓' },
];

// ── Props ────────────────────────────────────────────────────────────────────

interface WarrantyRegistrationWorkspaceProps {
  onClose: () => void;
  onSubmit: (payload: any) => Promise<boolean>;
  pastClaimsLoader: (productId: string, variantId?: string | null, serialNumber?: string | null) => any[];
  initialProduct?: any | null;
}

// ── Step Progress Bar ─────────────────────────────────────────────────────────

function StepBar({ current, hasProduct }: { current: number; hasProduct: boolean }) {
  if (!hasProduct && current === 1) return null;
  return (
    <div className="hidden md:flex items-center gap-1">
      {STEPS.slice(0, 4).map((step, i) => {
        const isDone = current > step.id;
        const isActive = current === step.id;
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300',
              isDone ? 'bg-emerald-500 text-white' :
              isActive ? 'bg-slate-900 text-white ring-4 ring-slate-200' :
              'bg-slate-100 text-slate-400'
            )}>
              <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black',
                isDone ? 'bg-white/20' : isActive ? 'bg-white/20' : ''
              )}>
                {isDone ? '✓' : step.short}
              </span>
              <span className="hidden lg:block">{step.label}</span>
            </div>
            {i < 3 && (
              <div className={cn('w-6 h-0.5 rounded-full transition-all duration-500', isDone ? 'bg-emerald-300' : 'bg-slate-200')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function WarrantyRegistrationWorkspace({ onClose, onSubmit, pastClaimsLoader, initialProduct }: WarrantyRegistrationWorkspaceProps) {
  const [currentStep, setCurrentStep] = useState(initialProduct ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimNumber, setClaimNumber] = useState<string | null>(null);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<any>(initialProduct ?? null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [issueDescription, setIssueDescription] = useState('');
  const [condition, setCondition] = useState('Good');
  const [accessoriesReceived, setAccessoriesReceived] = useState<string[]>([]);
  const [decision, setDecision] = useState('REPAIR');
  const [technician, setTechnician] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [internalNotes, setInternalNotes] = useState('');

  const pastClaims = selectedProduct
    ? pastClaimsLoader(selectedProduct.productId, selectedProduct.variantId, selectedProduct.serialNumber)
    : [];

  const hasDuplicateActiveClaim =
    selectedProduct?.claim &&
    selectedProduct.claim.status !== 'CLOSED' &&
    selectedProduct.claim.status !== 'REJECTED';

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 1 && !selectedProduct) return toast.error('Please identify a product first.');
    if (currentStep === 2 && selectedCategories.length === 0) return toast.error('Please select at least one issue category.');
    if (currentStep === 2 && !issueDescription.trim()) return toast.error('Please enter a customer description.');
    if (currentStep === 3 && !condition) return toast.error('Please select the product condition.');
    if (currentStep === 4 && decision === 'REPAIR' && !technician) return toast.error('Please assign a technician for in-house repair.');

    if (currentStep === 4) {
      handleSubmit();
    } else {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const allAccessories = ['Box', 'Charger', 'Cable', 'Manual', 'Earbuds', 'Battery', 'SIM Tray', 'Remote'];
    const accessoriesMissing = allAccessories.filter(a => !accessoriesReceived.includes(a));

    const payload = {
      orderId:          selectedProduct.orderId,
      productId:        selectedProduct.productId,
      variantId:        selectedProduct.variantId,
      serialNumber:     selectedProduct.serialNumber,
      imei:             selectedProduct.imei,
      warrantyType:     selectedProduct.warrantyType,
      purchaseDate:     selectedProduct.purchaseDate,
      issueCategory:    selectedCategories.join(', '),
      issueDescription,
      accessoriesReceived,
      accessoriesMissing,
      condition,
      technicianNotes: `Decision: ${decision} | Tech: ${technician} | Priority: ${priority}\n${internalNotes}`,
    };

    const success = await onSubmit(payload);
    setIsSubmitting(false);

    if (success) {
      setClaimNumber(`WC-${Date.now().toString().slice(-6)}`);
      setCurrentStep(5);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const isSuccess = currentStep === 5;
  const isProductStep = currentStep === 1 && !selectedProduct;
  const isWorkspaceStep = !isSuccess && selectedProduct;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50 animate-in fade-in duration-200 overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          TOP HEADER BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="h-14 px-5 flex items-center justify-between gap-4">

          {/* Logo mark + title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-slate-900 leading-none">Service Ticket</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">Warranty Registration</p>
            </div>
          </div>

          {/* Step Progress */}
          <StepBar current={currentStep} hasProduct={!!selectedProduct} />

          {/* Close */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500 hover:text-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile step indicator */}
        {selectedProduct && !isSuccess && (
          <div className="md:hidden px-5 pb-2.5 flex items-center gap-2">
            {STEPS.slice(0, 4).map((step, i) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all',
                  currentStep > step.id ? 'bg-emerald-500 text-white' :
                  currentStep === step.id ? 'bg-slate-900 text-white' :
                  'bg-slate-200 text-slate-400'
                )}>{currentStep > step.id ? '✓' : step.short}</div>
                {i < 3 && <div className={cn('w-4 h-0.5 rounded', currentStep > step.id ? 'bg-emerald-400' : 'bg-slate-200')} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN BODY
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── STEP 1: Product Finder (Full Screen) ─────────────────────── */}
        {isProductStep && (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
            <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">

              {/* Hero copy */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Identify Product</h2>
                <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                  Search by product name, barcode, IMEI, serial, customer phone, or invoice number
                </p>
              </div>

              {/* Quick method pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['Barcode', 'IMEI', 'Serial', 'Phone', 'Invoice', 'Name'].map(m => (
                  <span key={m} className="text-[11px] font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-full text-slate-500 shadow-sm">
                    {m}
                  </span>
                ))}
              </div>

              {/* Search Box */}
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-2">
                <ProductFinder
                  mode="warranty"
                  autoFocus
                  onSelect={item => {
                    setSelectedProduct(item);
                    setCurrentStep(2);
                  }}
                />
              </div>

              {/* Scan hint */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
                <Scan className="w-3.5 h-3.5" />
                <span>USB barcode scanner works directly — just scan the product</span>
              </div>
            </div>
          </div>
        )}

        {/* ─── WORKSPACE: 3-Column Layout (Steps 2, 3, 4) ──────────────── */}
        {isWorkspaceStep && (
          <>
            {/* LEFT COLUMN — Product Summary */}
            <div className="hidden lg:flex w-[280px] xl:w-[300px] shrink-0 flex-col p-4 border-r border-slate-200 bg-white overflow-y-auto gap-4">
              <ProductSummaryCard item={selectedProduct} />

              {/* Change product link */}
              <button
                onClick={() => { setSelectedProduct(null); setCurrentStep(1); }}
                className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors text-center py-2 rounded-xl hover:bg-blue-50"
              >
                ← Search different product
              </button>
            </div>

            {/* CENTER COLUMN — Active Step */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-5 sm:px-8 xl:px-12 py-8 pb-32">

                {/* Duplicate claim warning */}
                {hasDuplicateActiveClaim && (
                  <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-800 text-sm">Active Claim Already Exists</p>
                      <p className="text-xs text-red-600 mt-1">
                        Claim {selectedProduct.claim.claimNumber} is currently {selectedProduct.claim.status}. You cannot create a duplicate claim for this unit.
                      </p>
                    </div>
                  </div>
                )}

                {/* Step content */}
                {!hasDuplicateActiveClaim && (
                  <>
                    {currentStep === 2 && (
                      <StepIssue
                        selectedCategories={selectedCategories}
                        onChangeCategories={setSelectedCategories}
                        description={issueDescription}
                        onChangeDescription={setIssueDescription}
                      />
                    )}
                    {currentStep === 3 && (
                      <StepInspection
                        condition={condition}
                        onChangeCondition={setCondition}
                        accessoriesReceived={accessoriesReceived}
                        onChangeAccessories={setAccessoriesReceived}
                      />
                    )}
                    {currentStep === 4 && (
                      <StepDecision
                        decision={decision}
                        onChangeDecision={setDecision}
                        technician={technician}
                        onChangeTechnician={setTechnician}
                        priority={priority}
                        onChangePriority={setPriority}
                        internalNotes={internalNotes}
                        onChangeNotes={setInternalNotes}
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — History & Timeline */}
            <div className="hidden xl:flex w-[280px] shrink-0 flex-col p-4 border-l border-slate-200 bg-white overflow-y-auto">
              <HistorySidebar pastClaims={pastClaims} />
            </div>
          </>
        )}

        {/* ─── STEP 5: Success Screen ────────────────────────────────────── */}
        {isSuccess && (
          <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto bg-white">
            <div className="max-w-md w-full space-y-8 text-center animate-in zoom-in-90 duration-500">

              {/* Success animation */}
              <div className="relative mx-auto w-28 h-28">
                <div className="w-28 h-28 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in-95 duration-700">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900">Service Ticket Created!</h2>
                {claimNumber && (
                  <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-mono text-sm font-bold">
                    {claimNumber}
                  </div>
                )}
                <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                  The warranty claim has been registered and the product has been routed to the{' '}
                  <strong>{decision === 'REPAIR' ? 'Service Center' : decision === 'SUPPLIER' ? 'Supplier Dispatch Queue' : 'Review Queue'}</strong>.
                </p>
              </div>

              {/* ERP notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                <p className="text-[11px] font-bold text-amber-800">ERP: Stock Ledger Unchanged</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Inventory is not increased. Sales ledger remains immutable. Product moved to Inspection Warehouse.</p>
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-700">
                  <Printer className="w-4 h-4" /> Print Slip
                </button>
                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-700">
                  <MessageSquare className="w-4 h-4" /> Send SMS
                </button>
                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-sm font-bold text-slate-700">
                  <Mail className="w-4 h-4" /> Email
                </button>
                <button type="button" className="flex items-center justify-center gap-2 h-12 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-sm font-bold text-blue-700 border border-blue-200">
                  <Printer className="w-4 h-4" /> Print Label
                </button>
              </div>

              {/* CTA */}
              <Button
                onClick={onClose}
                className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION BAR (Steps 2, 3, 4)
      ═══════════════════════════════════════════════════════════════════════ */}
      {isWorkspaceStep && !hasDuplicateActiveClaim && (
        <div className="shrink-0 bg-white border-t border-slate-200 shadow-[0_-2px_16px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-5xl mx-auto px-5 h-18 py-3 flex items-center justify-between gap-4">

            {/* Back */}
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-11 px-5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            {/* Step label (mobile) */}
            <div className="text-center hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Step {currentStep - 1} of 4
              </p>
              <p className="text-sm font-bold text-slate-700">
                {currentStep === 2 ? 'Issue Registration' : currentStep === 3 ? 'Physical Inspection' : 'Resolution Decision'}
              </p>
            </div>

            {/* Continue / Submit */}
            <Button
              onClick={handleNext}
              disabled={isSubmitting || !!hasDuplicateActiveClaim}
              className={cn(
                'h-11 px-7 rounded-xl font-bold text-sm shadow-lg transition-all',
                currentStep === 4
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20'
              )}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Registering...
                </div>
              ) : currentStep === 4 ? (
                <>Confirm & Register</>
              ) : (
                <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Duplicate Claim Footer ── */}
      {isWorkspaceStep && hasDuplicateActiveClaim && (
        <div className="shrink-0 bg-white border-t border-slate-200 px-5 py-4 flex justify-end">
          <Button variant="outline" onClick={onClose} className="h-11 px-6 rounded-xl font-bold">
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
