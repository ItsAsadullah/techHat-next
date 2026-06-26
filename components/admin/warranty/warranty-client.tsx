'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Shield, Wrench, RefreshCw, CheckCircle2, Clock,
  ArrowLeftRight, Truck, UserCheck, History, Plus,
  Search, Check, AlertTriangle, FileText, Camera,
  CheckCircle, AlertCircle, Trash2, Upload, User,
  Phone, Mail, Tag, ChevronRight, Calendar, DollarSign,
  Activity, X
} from 'lucide-react';
import {
  createWarrantyClaim,
  getWarrantyClaims,
  updateClaimStatus,
  updateRepairJob,
  submitQCReport,
  dispatchToSupplier,
  receiveFromSupplier,
  processExchangeReplacement,
  generatePickupOTP,
  processPickupClosure,
  ensureAfterSalesWarehouses
} from '@/lib/actions/after-sales-actions';
import { searchOrderForReturn } from '@/lib/actions/return-actions';
import Image from 'next/image';
import { ProductFinder } from '@/components/admin/shared/product-finder';
import { WarrantyRegistrationWorkspace } from './registration/warranty-registration-workspace';

// ─── Constants ─────────────────────────────────────────────────────────────────

const ACCESSORIES = [
  { id: 'box', label: 'Box' },
  { id: 'charger', label: 'Charger' },
  { id: 'cable', label: 'Cable' },
  { id: 'battery', label: 'Battery' },
  { id: 'adapter', label: 'Adapter' },
  { id: 'remote', label: 'Remote' },
  { id: 'earbuds', label: 'Earbuds' },
  { id: 'sim_tray', label: 'SIM Tray' },
  { id: 'manual', label: 'Manual' },
];

const CONDITIONS = [
  'Brand New', 'Good', 'Used', 'Minor Damage', 'Major Damage', 'Water Damage', 'Broken', 'Dead'
];

const TECHNICIANS = [
  { id: 'tech_joy', name: 'Technician Joy' },
  { id: 'tech_shuvo', name: 'Technician Shuvo' },
  { id: 'tech_rashed', name: 'Technician Rashed' },
];

export default function WarrantyClient({ claims: initialClaims }: { claims: any[] }) {
  const [claims, setClaims] = useState(initialClaims);
  const getClaimHistory = (productId: string, variantId?: string | null, serialNumber?: string | null) => {
    return claims.filter(c => 
      c.productId === productId && 
      (variantId ? c.variantId === variantId : true) &&
      (serialNumber ? c.serialNumber === serialNumber : true)
    );
  };
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);
  const [foundOrder, setFoundOrder] = useState<any>(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState<any>(null);

  // New Claim Form State
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [selectedWarrantyItem, setSelectedWarrantyItem] = useState<any>(null);
  const [warrantyType, setWarrantyType] = useState('Official Warranty');
  const [serialNumber, setSerialNumber] = useState('');
  const [imei, setImei] = useState('');
  const [issueCategory, setIssueCategory] = useState('Display Issue');
  const [issueDescription, setIssueDescription] = useState('');
  const [accessoriesReceived, setAccessoriesReceived] = useState<string[]>([]);
  const [accessoriesMissing, setAccessoriesMissing] = useState<string[]>([]);
  const [productCondition, setProductCondition] = useState('Good');
  const [customAccessory, setCustomAccessory] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Selected Claim Detail Drawer
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [drawerTab, setDrawerTab] = useState('info');

  // Technician Form states
  const [assignedTo, setAssignedTo] = useState('');
  const [repairPriority, setRepairPriority] = useState('MEDIUM');
  const [repairType, setRepairType] = useState('HARDWARE');
  const [expectCompletion, setExpectCompletion] = useState('');
  const [repairNotes, setRepairNotes] = useState('');
  const [repairCost, setRepairCost] = useState('');
  const [newPartName, setNewPartName] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartCost, setNewPartCost] = useState('0');

  // Supplier Form states
  const [courierName, setCourierName] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [expectedSupplierReturn, setExpectedSupplierReturn] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  // Exchange Form states
  const [depreciation, setDepreciation] = useState('0');
  const [warrantyCoverage, setWarrantyCoverage] = useState('0');
  const [exchangeReason, setExchangeReason] = useState('');

  // OTP Pickup states
  const [pickupOTP, setPickupOTP] = useState('');
  const [pickupSignature, setPickupSignature] = useState('');
  const [pickupOTPInput, setPickupOTPInput] = useState('');

  // Loading indicator
  const [isLoading, setIsLoading] = useState(false);

  // Auto initialize warehouses on mount
  useEffect(() => {
    ensureAfterSalesWarehouses().catch(console.error);
  }, []);

  const refreshData = async () => {
    const list = await getWarrantyClaims();
    setClaims(list);
    if (selectedClaim) {
      const updated = list.find(c => c.id === selectedClaim.id);
      if (updated) setSelectedClaim(updated);
    }
  };

  const handleSearchOrder = async () => {
    if (!searchQuery.trim()) return;
    setIsSearchingOrder(true);
    const res = await searchOrderForReturn(searchQuery);
    setIsSearchingOrder(false);
    if (res.success && res.order) {
      setFoundOrder(res.order);
      setSelectedOrderItem(null);
    } else {
      toast.error('Order not found or ineligible.');
      setFoundOrder(null);
    }
  };

  const handleCreateClaim = async () => {
    if (!selectedWarrantyItem) return toast.error('Please select a warranty eligible product first.');
    if (!issueDescription.trim()) return toast.error('Please enter problem description.');

    setIsLoading(true);
    const res = await createWarrantyClaim({
      orderId: selectedWarrantyItem.orderId,
      productId: selectedWarrantyItem.productId,
      variantId: selectedWarrantyItem.variantId,
      serialNumber: selectedWarrantyItem.serialNumber,
      imei: selectedWarrantyItem.imei,
      warrantyType: selectedWarrantyItem.warrantyType,
      purchaseDate: selectedWarrantyItem.purchaseDate,
      issueCategory,
      issueDescription,
      accessoriesReceived,
      accessoriesMissing,
      condition: productCondition,
      technicianNotes,
    });
    setIsLoading(false);

    if (res.success) {
      toast.success('Warranty Claim Registered successfully.');
      setShowClaimForm(false);
      setSelectedWarrantyItem(null);
      setSerialNumber('');
      setImei('');
      setIssueDescription('');
      setAccessoriesReceived([]);
      setAccessoriesMissing([]);
      refreshData();
    } else {
      toast.error(res.error || 'Failed to register claim.');
    }
  };

  const handleWorkspaceSubmit = async (payload: any) => {
    setIsLoading(true);
    const res = await createWarrantyClaim(payload);
    setIsLoading(false);

    if (res.success) {
      toast.success('Warranty Claim Registered successfully.');
      refreshData();
      return true;
    } else {
      toast.error(res.error || 'Failed to register claim.');
      return false;
    }
  };

  const handleUpdateStatusAction = async (claimId: string, status: string, note: string, decision?: string) => {
    setIsLoading(true);
    const res = await updateClaimStatus(claimId, status, note, decision);
    setIsLoading(false);
    if (res.success) {
      toast.success(`Claim Status updated to ${status}`);
      refreshData();
    } else {
      toast.error(res.error || 'Failed to update status.');
    }
  };

  const handleUpdateRepairJobAction = async (jobId: string, data: any) => {
    setIsLoading(true);
    const res = await updateRepairJob(jobId, data);
    setIsLoading(false);
    if (res.success) {
      toast.success('Service Job updated.');
      refreshData();
    } else {
      toast.error(res.error || 'Failed to update job.');
    }
  };

  const handleQCAction = async (jobId: string, status: 'PASS' | 'FAIL' | 'REWORK', notes: string) => {
    setIsLoading(true);
    const res = await submitQCReport(jobId, status, notes, 'QC Inspector Admin');
    setIsLoading(false);
    if (res.success) {
      toast.success(`QC Report submitted: ${status}`);
      refreshData();
    } else {
      toast.error(res.error || 'Failed to submit QC report.');
    }
  };

  const handleSendToSupplierAction = async (claimId: string) => {
    if (!courierName || !trackingCode || !expectedSupplierReturn) {
      return toast.error('Please fill courier details.');
    }
    setIsLoading(true);
    const res = await dispatchToSupplier(claimId, {
      courierCompany: courierName,
      trackingNumber: trackingCode,
      expectedReturn: new Date(expectedSupplierReturn),
      supplierNotes,
    });
    setIsLoading(false);
    if (res.success) {
      toast.success('Dispatched to supplier.');
      setCourierName('');
      setTrackingCode('');
      setExpectedSupplierReturn('');
      setSupplierNotes('');
      refreshData();
    } else {
      toast.error(res.error || 'Failed to dispatch.');
    }
  };

  const handleReceiveFromSupplierAction = async (claimId: string, status: 'Returned' | 'Replacement Approved' | 'Rejected') => {
    setIsLoading(true);
    const res = await receiveFromSupplier(claimId, {
      status,
      notes: 'Received courier shipment back from Supplier/Brand',
    });
    setIsLoading(false);
    if (res.success) {
      toast.success(`Received back. Status: ${status}`);
      refreshData();
    } else {
      toast.error(res.error || 'Failed to log receipt.');
    }
  };

  const handleExchangeAction = async (claimId: string, itemPrice: number) => {
    const dep = parseFloat(depreciation) || 0;
    const cov = parseFloat(warrantyCoverage) || 0;
    const diff = itemPrice - cov;

    setIsLoading(true);
    const res = await processExchangeReplacement(claimId, {
      originalPrice: itemPrice,
      currentValue: itemPrice - dep,
      depreciation: dep,
      warrantyCoverage: cov,
      replacementProductId: selectedClaim.productId,
      replacementVariantId: selectedClaim.variantId,
      replacementPrice: itemPrice,
      difference: diff,
      whoPays: 'STORE',
      reason: exchangeReason || 'Warranty Replacement',
    });
    setIsLoading(false);
    if (res.success) {
      toast.success('Exchange process completed successfully.');
      setDepreciation('0');
      setWarrantyCoverage('0');
      setExchangeReason('');
      refreshData();
    } else {
      toast.error(res.error || 'Exchange failed.');
    }
  };

  const handleSendOTPAction = async (claimId: string) => {
    setIsLoading(true);
    const res = await generatePickupOTP(claimId);
    setIsLoading(false);
    if (res.success) {
      toast.success(`OTP code generated: ${res.otp} (For testing/mock purposes)`);
      setPickupOTP(res.otp || '');
      refreshData();
    } else {
      toast.error(res.error || 'Failed to generate OTP.');
    }
  };

  const handleVerifyOTPAction = async (claimId: string) => {
    if (!pickupOTPInput) return toast.error('Please input OTP.');
    setIsLoading(true);
    const res = await processPickupClosure(claimId, {
      otp: pickupOTPInput,
      signature: pickupSignature || 'Customer Digital Sign',
    });
    setIsLoading(false);
    if (res.success) {
      toast.success('OTP verified. Unit delivered to customer. Claim Closed.');
      setPickupOTPInput('');
      setPickupSignature('');
      setPickupOTP('');
      refreshData();
    } else {
      toast.error(res.error || 'Invalid OTP verification code.');
    }
  };

  const toggleAccessory = (accId: string, section: 'received' | 'missing') => {
    if (section === 'received') {
      setAccessoriesReceived(p => p.includes(accId) ? p.filter(i => i !== accId) : [...p, accId]);
    } else {
      setAccessoriesMissing(p => p.includes(accId) ? p.filter(i => i !== accId) : [...p, accId]);
    }
  };

  // Stats Derived
  const totalClaims = claims.length;
  const pendingInspection = claims.filter(c => c.status === 'RECEIVED' || c.status === 'PENDING_INSPECTION' || c.status === 'UNDER_INSPECTION').length;
  const inRepair = claims.filter(c => c.repairJob && c.repairJob.status !== 'READY').length;
  const readyPickup = claims.filter(c => c.status === 'READY_FOR_PICKUP').length;

  const [pendingProduct, setPendingProduct] = useState<any>(null);

  return (
    <div className="flex flex-col gap-6 min-h-screen bg-gray-50/50 pb-20">
      
      {/* ─── Top Workspace Navigator ─────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600 animate-pulse" />
              After Sales Service Center
            </h1>
            <p className="text-xs text-gray-500 font-medium">Enterprise After-Sales, Repair, Exchange & Pickup Center</p>
          </div>
          <Button variant="outline" onClick={refreshData} className="px-3 py-2 rounded-xl shrink-0">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </Button>
        </div>

        {/* ── Google-style Inline Search ── */}
        <div className="w-full">
          <div className="relative">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Search className="w-3 h-3" /> New Warranty Claim — Search Product, IMEI, Serial, Barcode, Customer or Invoice
            </p>
            <ProductFinder
              mode="warranty"
              onSelect={(item) => {
                setPendingProduct(item);
                setShowClaimForm(true);
              }}
            />
          </div>
        </div>
      </div>

      <div className="px-6 flex flex-col lg:flex-row gap-6">
        
        {/* ─── Left Sidebar Navigator ───────────────────────────────────── */}
        <div className="w-full lg:w-64 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 bg-white p-2 rounded-2xl border border-gray-100 shadow-xs h-fit">
          {[
            { id: 'dashboard', label: 'Overview Dashboard', icon: Activity },
            { id: 'claims', label: 'Warranty Claims', icon: Shield, badge: pendingInspection },
            { id: 'service', label: 'Service Center (Repairs)', icon: Wrench, badge: inRepair },
            { id: 'supplier', label: 'Supplier Warranty', icon: Truck },
            { id: 'pickup', label: 'Pickup Center', icon: UserCheck, badge: readyPickup },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSelectedClaim(null); }}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all text-left whitespace-nowrap lg:whitespace-normal ${
                  active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1">{tab.label}</span>
                {!!tab.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    active ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── Main Content Canvas ───────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          
          {/* ── Tab Content: Dashboard Overview ── */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Claims', value: totalClaims, icon: Shield, bg: 'bg-blue-50 text-blue-600' },
                  { label: 'Pending Inspection', value: pendingInspection, icon: Clock, bg: 'bg-amber-50 text-amber-600' },
                  { label: 'Repairs in Progress', value: inRepair, icon: Wrench, bg: 'bg-purple-50 text-purple-600' },
                  { label: 'Ready for Pickup', value: readyPickup, icon: CheckCircle2, bg: 'bg-green-50 text-green-600' },
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={i} className="p-4 border-gray-150 shadow-xs flex items-center gap-4 bg-white hover:shadow-sm transition-all rounded-2xl">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-0.5">{stat.value}</h3>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Performance Reports Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-5 border-gray-100 rounded-2xl bg-white lg:col-span-2">
                  <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                    <History className="h-4 w-4 text-blue-600" /> Recent Claims Lifecycle Activity
                  </h3>
                  <div className="space-y-4">
                    {claims.slice(0, 4).map(claim => (
                      <div key={claim.id} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 hover:bg-gray-55 transition-colors cursor-pointer" onClick={() => { setSelectedClaim(claim); setDrawerTab('timeline'); }}>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-xs">{claim.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{claim.claimNumber} · Purchased on {new Date(claim.purchaseDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider">{claim.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {claims.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">No claim history logged yet.</p>
                    )}
                  </div>
                </Card>

                <Card className="p-5 border-gray-100 rounded-2xl bg-white">
                  <h3 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" /> Technician Operations
                  </h3>
                  <div className="space-y-4">
                    {TECHNICIANS.map(tech => {
                      const assignedCount = claims.filter(c => c.repairJob && c.repairJob.assignedTo === tech.id).length;
                      return (
                        <div key={tech.id} className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-b-0">
                          <span className="text-xs font-bold text-gray-700">{tech.name}</span>
                          <Badge className="bg-purple-50 text-purple-600 text-[10px] font-black">{assignedCount} active jobs</Badge>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ── Tab Content: Claims List ── */}
          {activeTab === 'claims' && (
            <Card className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-4 font-semibold">Claim Card</th>
                      <th className="px-5 py-4 font-semibold">Product Name</th>
                      <th className="px-5 py-4 font-semibold">Hardware Tags</th>
                      <th className="px-5 py-4 font-semibold">Status Stage</th>
                      <th className="px-5 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-50">
                    {claims.map(claim => (
                      <tr key={claim.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedClaim(claim)}>
                        <td className="px-5 py-4 font-bold text-gray-900 font-mono">{claim.claimNumber}</td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-gray-800 leading-tight">{claim.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">Order: {claim.order.orderNumber}</p>
                        </td>
                        <td className="px-5 py-4 font-mono text-[10px] text-gray-500">
                          {claim.serialNumber ? `SN: ${claim.serialNumber}` : claim.imei ? `IMEI: ${claim.imei}` : 'No SN/IMEI'}
                        </td>
                        <td className="px-5 py-4">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black text-[9px] uppercase tracking-wider">
                            {claim.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                        </td>
                      </tr>
                    ))}
                    {claims.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No warranty claims found. Click New Claim to register.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Tab Content: Service Center (Technician Queue) ── */}
          {activeTab === 'service' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {claims.filter(c => c.repairJob).map(claim => {
                  const job = claim.repairJob;
                  return (
                    <Card key={claim.id} className="p-4 border-gray-150 bg-white rounded-2xl flex flex-col gap-3 hover:shadow-sm transition-all" onClick={() => { setSelectedClaim(claim); setDrawerTab('service'); }}>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-purple-600 font-mono">{job.jobCardNumber}</span>
                        <Badge className="bg-purple-50 text-purple-700 text-[9px] font-black uppercase tracking-wider">{job.status}</Badge>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs line-clamp-1 leading-tight">{claim.product.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">SN: {claim.serialNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 text-[10px] text-gray-500 line-clamp-2">
                        {claim.issueDescription}
                      </div>
                      {job.assignedTo && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-gray-600">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          <span>{TECHNICIANS.find(t => t.id === job.assignedTo)?.name || job.assignedTo}</span>
                        </div>
                      )}
                    </Card>
                  );
                })}
                {claims.filter(c => c.repairJob).length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-400 font-semibold bg-white rounded-2xl border border-gray-100">
                    No active service jobs. Send a claim to repair to initialize.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Tab Content: Supplier Warranty Portal ── */}
          {activeTab === 'supplier' && (
            <Card className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                      <th className="px-5 py-4 font-semibold">Claim Card</th>
                      <th className="px-5 py-4 font-semibold">Brand / Supplier</th>
                      <th className="px-5 py-4 font-semibold">Courier Log</th>
                      <th className="px-5 py-4 font-semibold">Supplier Status</th>
                      <th className="px-5 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-gray-50">
                    {claims.filter(c => c.supplierWarranty).map(claim => {
                      const sup = claim.supplierWarranty as any;
                      return (
                        <tr key={claim.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => { setSelectedClaim(claim); setDrawerTab('supplier'); }}>
                          <td className="px-5 py-4 font-bold text-gray-900 font-mono">{claim.claimNumber}</td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-800 leading-tight">{claim.product.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Brand: {claim.product.brand?.name || 'Generic'}</p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-700 leading-tight">{sup.courierCompany}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Tracking: {sup.trackingNumber}</p>
                          </td>
                          <td className="px-5 py-4">
                            <Badge className="bg-orange-50 text-orange-700 border-orange-100 font-black text-[9px] uppercase tracking-wider">
                              {sup.status || 'SENT'}
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <ChevronRight className="h-4 w-4 text-gray-300 ml-auto" />
                          </td>
                        </tr>
                      );
                    })}
                    {claims.filter(c => c.supplierWarranty).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400 font-medium">No supplier tickets active.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Tab Content: Customer Pickup Center ── */}
          {activeTab === 'pickup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {claims.filter(c => c.status === 'READY_FOR_PICKUP').map(claim => (
                <Card key={claim.id} className="p-4 border-gray-150 bg-white rounded-2xl flex flex-col gap-3 hover:shadow-sm transition-all" onClick={() => { setSelectedClaim(claim); setDrawerTab('pickup'); }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-green-600 font-mono">{claim.claimNumber}</span>
                    <Badge className="bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-wider">READY</Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-xs line-clamp-1 leading-tight">{claim.product.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">Customer: {claim.order.customerName}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">Phone: {claim.order.customerPhone}</p>
                  </div>
                  <Button variant="outline" className="w-full h-9 border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold rounded-xl mt-2">
                    Start Verification & Pickup
                  </Button>
                </Card>
              ))}
              {claims.filter(c => c.status === 'READY_FOR_PICKUP').length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-400 font-semibold bg-white rounded-2xl border border-gray-100">
                  No items waiting in the customer pickup queue.
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ─── Slide-over Claim Detail Drawer ────────────────────────────── */}
      {selectedClaim && (
        <div className="fixed inset-0 z-[60] flex">
          <div className="flex-1 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedClaim(null)} />
          <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <div>
                  <h2 className="font-black text-sm">{selectedClaim.claimNumber}</h2>
                  <p className="text-[10px] text-gray-400">Order: {selectedClaim.order.orderNumber} · {selectedClaim.order.customerName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-gray-200 shrink-0 bg-gray-50 overflow-x-auto">
              {[
                { id: 'info', label: 'Claim details' },
                { id: 'service', label: 'Repair status', condition: !!selectedClaim.repairJob },
                { id: 'supplier', label: 'Supplier warranty' },
                { id: 'exchange', label: 'Exchange Calc' },
                { id: 'pickup', label: 'Pickup Verification' },
                { id: 'timeline', label: 'Timeline History' },
              ].map(tab => {
                if (tab.condition === false) return null;
                const active = drawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDrawerTab(tab.id)}
                    className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
                      active ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {drawerTab === 'info' && (
                <div className="space-y-4">
                  <Card className="p-3 bg-gray-50/50 border-gray-100 rounded-xl space-y-2 text-xs">
                    <p className="text-gray-400 font-bold uppercase tracking-wider text-[9px]">Customer Details</p>
                    <p className="font-bold text-gray-800">{selectedClaim.order.customerName}</p>
                    <p className="text-gray-600 font-mono">Phone: {selectedClaim.order.customerPhone}</p>
                    <p className="text-gray-600">Email: {selectedClaim.order.customerEmail || 'No Email'}</p>
                  </Card>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product Info</label>
                    <p className="text-xs font-bold text-gray-800">{selectedClaim.product.name}</p>
                    {selectedClaim.variant && <p className="text-[10px] text-gray-400">{selectedClaim.variant.name}</p>}
                    <p className="text-[10px] text-gray-400 font-mono">SKU: {selectedClaim.product.sku || 'N/A'}</p>
                    {selectedClaim.serialNumber && <p className="text-[10px] text-gray-400 font-mono">SN: {selectedClaim.serialNumber}</p>}
                    {selectedClaim.imei && <p className="text-[10px] text-gray-400 font-mono">IMEI: {selectedClaim.imei}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Warranty Info</label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold bg-blue-50 text-blue-600">{selectedClaim.warrantyType}</Badge>
                      <span className="text-[10px] text-gray-500 font-mono">Purchased: {new Date(selectedClaim.purchaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Product Condition</label>
                    <p className="text-xs font-bold text-gray-700">{selectedClaim.condition || 'Good'}</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Accessories Received</label>
                    <div className="flex flex-wrap gap-1">
                      {selectedClaim.accessoriesReceived?.map((acc: string) => (
                        <Badge key={acc} className="bg-gray-100 text-gray-600 font-bold text-[10px]">{acc}</Badge>
                      )) || 'None'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Accessories Missing</label>
                    <div className="flex flex-wrap gap-1">
                      {selectedClaim.accessoriesMissing?.map((acc: string) => (
                        <Badge key={acc} className="bg-red-50 text-red-600 border-red-100 font-bold text-[10px]">{acc}</Badge>
                      )) || 'None'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Customer Reported Issue</label>
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">{selectedClaim.issueDescription}</p>
                  </div>

                  {selectedClaim.status === 'RECEIVED' && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleUpdateStatusAction(selectedClaim.id, 'UNDER_INSPECTION', 'Inspection started.')} className="flex-1 bg-blue-600 text-white font-bold text-xs rounded-xl py-4">
                        Start Inspection
                      </Button>
                    </div>
                  )}

                  {selectedClaim.status === 'UNDER_INSPECTION' && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => handleUpdateStatusAction(selectedClaim.id, 'APPROVED', 'Claim Approved for Repair.', 'REPAIR')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl py-4">
                        Approve for Repair
                      </Button>
                      <Button onClick={() => handleUpdateStatusAction(selectedClaim.id, 'REJECTED', 'Claim Rejected by inspection.', 'REJECT')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl py-4">
                        Reject Claim
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'service' && selectedClaim.repairJob && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-[10px] font-black text-purple-700 font-mono">{selectedClaim.repairJob.jobCardNumber}</span>
                    <Badge className="bg-purple-200 text-purple-800 text-[10px] font-black">{selectedClaim.repairJob.status}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Assign Technician</label>
                      <Select value={assignedTo || selectedClaim.repairJob.assignedTo || ''} onValueChange={(val) => { setAssignedTo(val); handleUpdateRepairJobAction(selectedClaim.repairJob.id, { assignedTo: val }); }}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select Tech" />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          {TECHNICIANS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Priority</label>
                      <Select value={repairPriority} onValueChange={(val) => { setRepairPriority(val); handleUpdateRepairJobAction(selectedClaim.repairJob.id, { priority: val }); }}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Update Status</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {['DIAGNOSING', 'WAITING_PARTS', 'REPAIRING'].map(s => (
                          <button
                            key={s}
                            onClick={() => handleUpdateRepairJobAction(selectedClaim.repairJob.id, { status: s })}
                            className={`px-3 py-2 border text-[10px] font-bold rounded-lg transition-colors ${
                              selectedClaim.repairJob.status === s
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-purple-50'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-150">
                      <label className="block text-[11px] font-bold text-gray-700 mb-2">Quality Control Inspection</label>
                      <div className="flex gap-2">
                        <Button onClick={() => handleQCAction(selectedClaim.repairJob.id, 'PASS', 'Passed standard operations check.')} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl py-3.5">
                          QC Pass
                        </Button>
                        <Button onClick={() => handleQCAction(selectedClaim.repairJob.id, 'FAIL', 'Failed quality audit. Reworking.')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl py-3.5">
                          QC Fail
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 'supplier' && (
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1.5 text-xs text-orange-800">
                    <p className="font-bold flex items-center gap-1"><Truck className="h-4 w-4" /> Supplier Dispatch</p>
                    <p className="text-[10px]">Use this workspace to log dispatch details if sending product to brand/supplier center.</p>
                  </div>

                  {selectedClaim.supplierWarranty ? (
                    <div className="space-y-3 bg-gray-55 p-3 rounded-xl border border-gray-150 text-xs">
                      <p className="font-bold text-gray-800">Tracking Info</p>
                      <p className="text-gray-600">Courier: {selectedClaim.supplierWarranty.courierCompany}</p>
                      <p className="text-gray-600 font-mono">Tracking Code: {selectedClaim.supplierWarranty.trackingNumber}</p>
                      <p className="text-gray-600">Dispatched: {new Date(selectedClaim.supplierWarranty.dispatchDate).toLocaleDateString()}</p>
                      <p className="text-gray-600 font-bold uppercase mt-2">Current Status: {selectedClaim.supplierWarranty.status}</p>

                      {selectedClaim.supplierWarranty.status === 'SENT' && (
                        <div className="grid grid-cols-3 gap-1 pt-2">
                          <Button size="sm" className="bg-green-600 text-[10px]" onClick={() => handleReceiveFromSupplierAction(selectedClaim.id, 'Replacement Approved')}>Replace</Button>
                          <Button size="sm" className="bg-blue-600 text-[10px]" onClick={() => handleReceiveFromSupplierAction(selectedClaim.id, 'Returned')}>Returned</Button>
                          <Button size="sm" className="bg-red-600 text-[10px]" onClick={() => handleReceiveFromSupplierAction(selectedClaim.id, 'Rejected')}>Reject</Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input placeholder="Courier Company (e.g. RedX, Pathao)" value={courierName} onChange={e => setCourierName(e.target.value)} />
                      <Input placeholder="Courier Tracking Code" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} />
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Expected Return Date</label>
                        <Input type="date" value={expectedSupplierReturn} onChange={e => setExpectedSupplierReturn(e.target.value)} />
                      </div>
                      <Textarea placeholder="Supplier Dispatch Notes..." value={supplierNotes} onChange={e => setSupplierNotes(e.target.value)} />
                      <Button onClick={() => handleSendToSupplierAction(selectedClaim.id)} className="w-full bg-blue-600 text-white font-bold text-xs rounded-xl py-4">
                        Confirm Supplier Dispatch
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'exchange' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1 text-xs text-indigo-800">
                    <p className="font-bold flex items-center gap-1"><ArrowLeftRight className="h-4 w-4" /> Exchange Calculator</p>
                    <p className="text-[10px]">Compute replacement depreciation and delta payouts.</p>
                  </div>

                  {selectedClaim.exchangeDetails ? (
                    <div className="space-y-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-150 text-xs">
                      <p className="font-bold text-gray-800">Exchange Logged</p>
                      <p className="text-gray-600">Original Price: ৳{selectedClaim.exchangeDetails.originalPrice.toLocaleString()}</p>
                      <p className="text-gray-600">Depreciation: -৳{selectedClaim.exchangeDetails.depreciation.toLocaleString()}</p>
                      <p className="text-gray-600 font-bold">Warranty Coverage: ৳{selectedClaim.exchangeDetails.warrantyCoverage.toLocaleString()}</p>
                      <p className="text-gray-600">Replacement Cost: ৳{selectedClaim.exchangeDetails.replacementPrice.toLocaleString()}</p>
                      <p className="text-gray-600 font-black text-indigo-700">Delta Difference: ৳{selectedClaim.exchangeDetails.difference.toLocaleString()} ({selectedClaim.exchangeDetails.whoPays} pays)</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Depreciation (৳)</label>
                        <Input type="number" value={depreciation} onChange={e => setDepreciation(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Warranty Coverage Value (৳)</label>
                        <Input type="number" value={warrantyCoverage} onChange={e => setWarrantyCoverage(e.target.value)} />
                      </div>
                      <Textarea placeholder="Exchange/Replacement notes..." value={exchangeReason} onChange={e => setExchangeReason(e.target.value)} />
                      
                      <div className="p-3 bg-gray-50 border border-gray-150 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span>Original Price:</span>
                          <span>৳{selectedClaim.product.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Depreciation:</span>
                          <span>-৳{parseFloat(depreciation) || 0}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-gray-200 pt-1.5 text-gray-800">
                          <span>Warranty Coverage:</span>
                          <span>৳{parseFloat(warrantyCoverage) || 0}</span>
                        </div>
                        <div className="flex justify-between font-black text-blue-700 text-sm border-t border-dashed border-gray-300 pt-1.5">
                          <span>Delta Difference:</span>
                          <span>৳{(selectedClaim.product.price - (parseFloat(warrantyCoverage) || 0)).toLocaleString()}</span>
                        </div>
                      </div>

                      <Button onClick={() => handleExchangeAction(selectedClaim.id, selectedClaim.product.price)} className="w-full bg-blue-600 text-white font-bold text-xs rounded-xl py-4">
                        Apply Exchange Replacement
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'pickup' && (
                <div className="space-y-4">
                  {selectedClaim.status !== 'READY_FOR_PICKUP' && selectedClaim.status !== 'CLOSED' ? (
                    <p className="text-xs text-gray-400 text-center py-6">This claim ticket is not ready for pickup.</p>
                  ) : selectedClaim.status === 'CLOSED' ? (
                    <div className="p-3 bg-green-50 border border-green-150 text-green-700 text-xs rounded-xl space-y-1">
                      <p className="font-bold">Unit Delivered</p>
                      <p>Delivered on: {selectedClaim.pickupDetails?.deliveredAt ? new Date(selectedClaim.pickupDetails.deliveredAt).toLocaleString() : 'N/A'}</p>
                      <p>Verified with OTP: Yes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Button onClick={() => handleSendOTPAction(selectedClaim.id)} className="w-full bg-blue-600 text-white font-bold text-xs rounded-xl py-4">
                          Generate & Send Delivery OTP
                        </Button>
                        {pickupOTP && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-700 font-bold">
                            Mock Test OTP: {pickupOTP}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 pt-4 border-t border-gray-150">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Verify Delivery OTP</label>
                        <Input placeholder="Enter 6-digit OTP" value={pickupOTPInput} onChange={e => setPickupOTPInput(e.target.value)} />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Customer Digital Signature</label>
                        <Input placeholder="Type Customer Name for Sign" value={pickupSignature} onChange={e => setPickupSignature(e.target.value)} />
                      </div>

                      <Button onClick={() => handleVerifyOTPAction(selectedClaim.id)} className="w-full bg-green-600 text-white font-bold text-xs rounded-xl py-4">
                        Verify OTP & Deliver
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {drawerTab === 'timeline' && (
                <div className="space-y-4">
                  <div className="relative border-l border-gray-200 pl-4 space-y-6">
                    {Array.isArray(selectedClaim.timeline) ? (
                      (selectedClaim.timeline as any[]).map((log, index) => (
                        <div key={index} className="relative">
                          <span className="absolute -left-[21px] top-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white" />
                          <div className="text-xs">
                            <span className="font-bold text-gray-900">{log.status}</span>
                            <span className="text-[10px] text-gray-400 ml-2">{new Date(log.date).toLocaleString()}</span>
                            <p className="text-gray-600 mt-1">{log.note}</p>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">By: {log.user}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400">No logs saved.</p>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50 shrink-0">
              <Button variant="outline" onClick={() => setSelectedClaim(null)} className="w-full h-11 text-xs font-bold rounded-xl">
                Close Detail Workspace
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* ─── Create Claim Workspace Overlay ─────────────────────────────── */}
      {showClaimForm && (
        <WarrantyRegistrationWorkspace 
          onClose={() => { setShowClaimForm(false); setPendingProduct(null); }} 
          onSubmit={handleWorkspaceSubmit}
          pastClaimsLoader={getClaimHistory}
          initialProduct={pendingProduct}
        />
      )}

    </div>
  );
}

function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
