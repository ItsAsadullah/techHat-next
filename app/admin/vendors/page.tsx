'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Phone,
  MapPin,
  FileText,
  Loader2,
  X,
  Check,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ChevronLeft,
  ChevronRight,
  Package,
  Calendar,
  Hash,
  RefreshCw,
  MoreHorizontal,
  Receipt,
  HandCoins,
  TrendingUp,
  Minus,
  ArrowUpDown,
  BadgeCheck,
  CircleDollarSign,
  Briefcase,
  Clock,
  ChevronDown,
  Users,
  Filter,
  Upload,
  ImageIcon,
  Printer,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierById,
  getSupplierList,
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
  createSupplierPayment,
  deleteSupplierPayment,
  getSupplierPayments,
  getSupplierLedger,
  getVendorDashboardStats,
  getProductsForPurchase,
  type SupplierInput,
  type PurchaseInput,
  type PurchaseItemInput,
  type SupplierPaymentInput,
} from '@/lib/actions/vendor-actions';
import { getInvoiceSettings } from '@/lib/actions/invoice-settings-actions';

// ═══════════════ Types ═══════════════

interface SupplierRow {
  id: string;
  name: string;
  companyName: string | null;
  phone: string;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  purchaseCount: number;
}

interface PurchaseRow {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  status: string;
  note: string | null;
  itemCount: number;
  supplier: { id: string; name: string; companyName: string | null };
}

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  stock: number;
  costPrice: number;
  price: number;
  images: string[];
  category?: { name: string } | null;
}

interface PurchaseItemRow {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
}

interface PaymentRow {
  id: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
}

interface LedgerEntry {
  date: string;
  type: 'Purchase' | 'Payment';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  paymentId?: string;
}

interface PurchaseDetail {
  id: string;
  invoiceNumber: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  discount: number;
  status: string;
  note: string | null;
  attachment: string | null;
  supplier: { id: string; name: string; companyName: string | null; phone: string; address: string | null };
  items: { id: string; productId: string; productName: string; productSku: string | null; productImage: string | null; quantity: number; costPrice: number; subtotal: number }[];
}

interface DashboardStats {
  supplierCount: number;
  totalPurchase: number;
  totalPaid: number;
  totalDue: number;
  monthlyPurchase: number;
  monthlyPurchaseCount: number;
  recentPurchases: PurchaseRow[];
  topSuppliers: { id: string; name: string; totalPurchase: number; totalDue: number }[];
}

type Tab = 'overview' | 'suppliers' | 'purchases' | 'new-purchase' | 'profile';

// ═══════════════ Constants ═══════════════

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'নগদ', icon: Banknote, color: 'text-green-600' },
  { value: 'CARD', label: 'কার্ড', icon: CreditCard, color: 'text-blue-600' },
  { value: 'MOBILE_BANKING', label: 'মোবাইল ব্যাংকিং', icon: Smartphone, color: 'text-purple-600' },
  { value: 'BANK_TRANSFER', label: 'ব্যাংক ট্রান্সফার', icon: Building2, color: 'text-indigo-600' },
];

// ═══════════════ Helpers ═══════════════

function formatCurrency(amount: number): string {
  return '৳' + amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    PAID: { label: 'Paid', bg: 'bg-green-50', text: 'text-green-700' },
    PARTIAL: { label: 'Partial', bg: 'bg-amber-50', text: 'text-amber-700' },
    CONFIRMED: { label: 'Due', bg: 'bg-red-50', text: 'text-red-700' },
    DRAFT: { label: 'Draft', bg: 'bg-gray-50', text: 'text-gray-600' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-gray-100', text: 'text-gray-500' },
  };
  const s = map[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', s.bg, s.text)}>
      {s.label}
    </span>
  );
}

// ═══════════════ Main Component ═══════════════

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);

  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Suppliers
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierPages, setSupplierPages] = useState(0);

  // Supplier Form
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierInput>({
    name: '', companyName: '', phone: '', address: '', notes: '',
  });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Profile
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState<'purchases' | 'payments' | 'ledger'>('purchases');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Purchases
  const [purchases, setPurchases] = useState<PurchaseRow[]>([]);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePages, setPurchasePages] = useState(0);

  // New Purchase
  const [purchaseSupplier, setPurchaseSupplier] = useState('');
  const [purchaseInvoice, setPurchaseInvoice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseDiscount, setPurchaseDiscount] = useState(0);
  const [purchasePaid, setPurchasePaid] = useState(0);
  const [purchaseNote, setPurchaseNote] = useState('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemRow[]>([]);
  const [savingPurchase, setSavingPurchase] = useState(false);

  // Product search for purchase
  const [productSearch, setProductSearch] = useState('');
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [allProductsLoaded, setAllProductsLoaded] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);

  // Voucher upload
  const [voucherUrl, setVoucherUrl] = useState<string | null>(null);
  const [uploadingVoucher, setUploadingVoucher] = useState(false);

  // Supplier list for dropdown
  const [supplierOptions, setSupplierOptions] = useState<{ id: string; name: string; companyName: string | null; phone: string }[]>([]);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSupplierDue, setPaymentSupplierDue] = useState(0);
  const [paymentSupplierName, setPaymentSupplierName] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');

  // Invoice view modal
  const [viewPurchase, setViewPurchase] = useState<PurchaseDetail | null>(null);
  const [viewPurchaseLoading, setViewPurchaseLoading] = useState(false);

  // Delete payment
  const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  // Company settings for print letterhead
  const [companySettings, setCompanySettings] = useState({
    name: 'TechHat', address: '', phone: '', logo: '',
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ═══════════════ Data Loading ═══════════════

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const res = await getVendorDashboardStats();
    if (res.success) setStats(res.data as DashboardStats);
    setLoading(false);
  }, []);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const res = await getSuppliers({ page: supplierPage, limit: 20, search: supplierSearch });
    if (res.success) {
      setSuppliers(res.data as SupplierRow[]);
      setSupplierTotal(res.total);
      setSupplierPages(res.pages);
    }
    setLoading(false);
  }, [supplierPage, supplierSearch]);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    const res = await getPurchases({ page: purchasePage, limit: 20, search: purchaseSearch });
    if (res.success) {
      setPurchases(res.data as PurchaseRow[]);
      setPurchasePages(res.pages);
    }
    setLoading(false);
  }, [purchasePage, purchaseSearch]);

  const loadSupplierOptions = useCallback(async () => {
    const res = await getSupplierList();
    if (res.success) setSupplierOptions(res.data as any);
  }, []);

  const loadProfile = useCallback(async (id: string) => {
    setProfileLoading(true);
    const res = await getSupplierById(id);
    if (res.success) setSupplierProfile(res.data);
    setProfileLoading(false);
  }, []);

  const loadLedger = useCallback(async (id: string) => {
    const res = await getSupplierLedger(id);
    if (res.success) setLedgerEntries(res.data as LedgerEntry[]);
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadDashboard();
    if (activeTab === 'suppliers') loadSuppliers();
    if (activeTab === 'purchases') loadPurchases();
    if (activeTab === 'new-purchase') loadSupplierOptions();
    if (activeTab === 'profile' && selectedSupplierId) {
      loadProfile(selectedSupplierId);
      loadLedger(selectedSupplierId);
    }
  }, [activeTab, loadDashboard, loadSuppliers, loadPurchases, loadSupplierOptions, loadProfile, loadLedger, selectedSupplierId]);

  // Load company settings once
  useEffect(() => {
    getInvoiceSettings().then((s) => {
      setCompanySettings({
        name: s.invoiceCompanyName || 'TechHat',
        address: s.invoiceCompanyAddress || '',
        phone: s.invoiceCompanyPhone || '',
        logo: s.invoiceLogo || '',
      });
    });
  }, []);

  // Product search debounce
  const loadAllProducts = useCallback(async () => {
    if (allProductsLoaded) return;
    setProductSearchLoading(true);
    const res = await getProductsForPurchase();
    if (res.success) {
      setAllProducts(res.data as ProductOption[]);
      setProductOptions(res.data as ProductOption[]);
      setAllProductsLoaded(true);
    }
    setProductSearchLoading(false);
  }, [allProductsLoaded]);

  useEffect(() => {
    if (!productSearch.trim()) {
      setProductOptions(allProducts);
      return;
    }
    const timer = setTimeout(async () => {
      setProductSearchLoading(true);
      const res = await getProductsForPurchase(productSearch);
      if (res.success) setProductOptions(res.data as ProductOption[]);
      setProductSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, allProducts]);

  // ═══════════════ Supplier CRUD ═══════════════

  const openSupplierForm = (supplier?: SupplierRow) => {
    if (supplier) {
      setEditingSupplierId(supplier.id);
      setSupplierForm({
        name: supplier.name,
        companyName: supplier.companyName || '',
        phone: supplier.phone,
        address: supplier.address || '',
        notes: supplier.notes || '',
      });
    } else {
      setEditingSupplierId(null);
      setSupplierForm({ name: '', companyName: '', phone: '', address: '', notes: '' });
    }
    setShowSupplierForm(true);
  };

  const saveSupplier = async () => {
    if (!supplierForm.name.trim() || !supplierForm.phone.trim()) return;
    setSavingSupplier(true);
    const res = editingSupplierId
      ? await updateSupplier(editingSupplierId, supplierForm)
      : await createSupplier(supplierForm);
    if (res.success) {
      setShowSupplierForm(false);
      loadSuppliers();
      loadSupplierOptions();
    }
    setSavingSupplier(false);
  };

  const handleDeleteSupplier = async (id: string) => {
    setDeleting(true);
    const res = await deleteSupplier(id);
    if (res.success) {
      setDeleteConfirm(null);
      loadSuppliers();
    }
    setDeleting(false);
  };

  // ═══════════════ Purchase ═══════════════

  const addProductToItems = (product: ProductOption) => {
    if (purchaseItems.find((i) => i.productId === product.id)) return;
    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        costPrice: product.costPrice || 0,
        subtotal: product.costPrice || 0,
      },
    ]);
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updatePurchaseItem = (idx: number, field: 'quantity' | 'costPrice', value: number) => {
    setPurchaseItems((prev) => {
      const items = [...prev];
      items[idx] = {
        ...items[idx],
        [field]: value,
        subtotal: field === 'quantity' ? value * items[idx].costPrice : items[idx].quantity * value,
      };
      return items;
    });
  };

  const removePurchaseItem = (idx: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const purchaseTotal = purchaseItems.reduce((sum, i) => sum + i.subtotal, 0) - purchaseDiscount;
  const purchaseDue = purchaseTotal - purchasePaid;

  const savePurchaseEntry = async () => {
    if (!purchaseSupplier || !purchaseInvoice.trim() || purchaseItems.length === 0) return;
    setSavingPurchase(true);
    const input: PurchaseInput = {
      supplierId: purchaseSupplier,
      invoiceNumber: purchaseInvoice,
      date: purchaseDate,
      discount: purchaseDiscount,
      paidAmount: purchasePaid,
      note: purchaseNote,
      attachment: voucherUrl || undefined,
      items: purchaseItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        costPrice: i.costPrice,
      })),
    };
    const res = await createPurchase(input);
    if (res.success) {
      // Reset form
      setPurchaseSupplier('');
      setPurchaseInvoice('');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseDiscount(0);
      setPurchasePaid(0);
      setPurchaseNote('');
      setPurchaseItems([]);
      setVoucherUrl(null);
      setActiveTab('purchases');
      loadPurchases();
    } else {
      alert(res.error || 'Error saving purchase');
    }
    setSavingPurchase(false);
  };

  // ═══════════════ Payment ═══════════════

  const openPaymentModal = (supplierId: string, due = 0, name = '') => {
    setPaymentSupplierId(supplierId);
    setPaymentAmount(0);
    setPaymentMethod('CASH');
    setPaymentNote('');
    setPaymentSupplierDue(due);
    setPaymentSupplierName(name);
    setPaymentSuccess(false);
    setShowPaymentModal(true);
  };

  const viewPurchaseDetail = async (id: string) => {
    setViewPurchaseLoading(true);
    setViewPurchase(null);
    const res = await getPurchaseById(id);
    if (res.success) setViewPurchase(res.data as PurchaseDetail);
    setViewPurchaseLoading(false);
  };

  const printInvoice = (p: PurchaseDetail) => {
    const letterhead = `<div style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:20px;display:flex;align-items:center;gap:16px">${companySettings.logo ? `<img src="${companySettings.logo}" style="height:50px;object-fit:contain" />` : ''}<div><h2 style="margin:0;font-size:20px;font-weight:700">${companySettings.name}</h2>${companySettings.address ? `<p style="margin:2px 0;font-size:11px;color:#555">${companySettings.address}</p>` : ''}${companySettings.phone ? `<p style="margin:2px 0;font-size:11px;color:#555">Phone: ${companySettings.phone}</p>` : ''}</div></div>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Invoice</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#111;max-width:750px;margin:auto}h1{font-size:18px;margin:0 0 4px}table{width:100%;border-collapse:collapse;margin-bottom:20px}th,td{padding:7px 10px;border:1px solid #ccc;font-size:12px}th{background:#f0f0f0;font-weight:700;text-align:left}.r{text-align:right}.totals-wrap{display:flex;justify-content:flex-end}.totals{width:260px;font-size:12px}.totals tr td{border:none;padding:3px 6px}.totals .sep td{border-top:1.5px solid #111;font-weight:700}@media print{body{padding:16px}}</style></head><body>${letterhead}<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px"><div><h1>Purchase Invoice</h1><p style="margin:2px 0;font-size:12px;color:#555">Invoice #: <strong>${p.invoiceNumber}</strong> &nbsp; Date: <strong>${formatDate(p.date)}</strong></p></div><div style="text-align:right"><p style="font-size:11px;color:#555;margin:0">Supplier</p><p style="font-size:13px;font-weight:700;margin:2px 0">${p.supplier.name}</p>${p.supplier.companyName ? `<p style="font-size:11px;color:#555;margin:0">${p.supplier.companyName}</p>` : ''}${p.supplier.phone ? `<p style="font-size:11px;color:#555;margin:0">${p.supplier.phone}</p>` : ''}${p.supplier.address ? `<p style="font-size:11px;color:#555;margin:0">${p.supplier.address}</p>` : ''}</div></div><table><thead><tr><th>#</th><th>Product</th><th>SKU</th><th class="r">Qty</th><th class="r">Unit Cost</th><th class="r">Subtotal</th></tr></thead><tbody>${p.items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.productName}</td><td>${item.productSku || '—'}</td><td class="r">${item.quantity}</td><td class="r">৳${item.costPrice.toLocaleString()}</td><td class="r">৳${item.subtotal.toLocaleString()}</td></tr>`).join('')}</tbody></table><div class="totals-wrap"><table class="totals"><tr><td>Subtotal</td><td class="r">৳${(p.totalAmount + p.discount).toLocaleString()}</td></tr>${p.discount > 0 ? `<tr><td>Discount</td><td class="r">-৳${p.discount.toLocaleString()}</td></tr>` : ''}<tr><td>Total</td><td class="r">৳${p.totalAmount.toLocaleString()}</td></tr><tr><td>Paid</td><td class="r">৳${p.paidAmount.toLocaleString()}</td></tr><tr class="sep"><td><strong>Due</strong></td><td class="r"><strong>৳${p.dueAmount.toLocaleString()}</strong></td></tr></table></div>${p.note ? `<p style="margin-top:16px;font-size:11px;color:#555">Note: ${p.note}</p>` : ''}<p style="margin-top:24px;font-size:10px;color:#999;text-align:center">Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} — ${companySettings.name}</p></body></html>`;
    const w = window.open('', '_blank', 'width=800,height=700');
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  const printPaymentReceipt = (supplierName: string, amount: number, method: string, note: string) => {
    const methodLabel = PAYMENT_METHODS.find((x) => x.value === method)?.label || method;
    const letterhead = `<div style="border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:16px;text-align:center">${companySettings.logo ? `<img src="${companySettings.logo}" style="height:40px;object-fit:contain;margin-bottom:4px" /><br>` : ''}<strong style="font-size:16px">${companySettings.name}</strong>${companySettings.address ? `<br><span style="font-size:11px;color:#555">${companySettings.address}</span>` : ''}${companySettings.phone ? `<br><span style="font-size:11px;color:#555">Phone: ${companySettings.phone}</span>` : ''}</div>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment Receipt</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111;max-width:400px;margin:auto}.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee;font-size:13px}@media print{body{padding:12px}}</style></head><body>${letterhead}<h2 style="text-align:center;margin:0 0 4px;font-size:16px">Payment Receipt</h2><p style="text-align:center;font-size:11px;color:#555;margin-bottom:16px">${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p><div class="row"><span>Supplier</span><strong>${supplierName}</strong></div><div class="row"><span>Amount Paid</span><strong>৳${amount.toLocaleString()}</strong></div><div class="row"><span>Payment Method</span><span>${methodLabel}</span></div>${note ? `<div class="row"><span>Note</span><span>${note}</span></div>` : ''}<p style="text-align:center;margin-top:24px;font-size:10px;color:#999">Thank you — ${companySettings.name}</p></body></html>`;
    const w = window.open('', '_blank', 'width=500,height=400');
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  const printLedger = (supplierName: string, supplierPhone: string, entries: LedgerEntry[]) => {
    const letterhead = `<div style="border-bottom:2px solid #111;padding-bottom:14px;margin-bottom:18px;display:flex;align-items:center;gap:14px">${companySettings.logo ? `<img src="${companySettings.logo}" style="height:46px;object-fit:contain" />` : ''}<div><strong style="font-size:18px">${companySettings.name}</strong>${companySettings.address ? `<br><span style="font-size:11px;color:#555">${companySettings.address}</span>` : ''}${companySettings.phone ? `<br><span style="font-size:11px;color:#555">Phone: ${companySettings.phone}</span>` : ''}</div></div>`;
    const rows = entries.map((e) => `<tr><td>${formatDate(e.date)}</td><td>${e.type}</td><td>${e.reference}</td><td>${e.description}</td><td style="text-align:right;color:#c00">${e.debit > 0 ? '৳' + e.debit.toLocaleString() : '—'}</td><td style="text-align:right;color:#166534">${e.credit > 0 ? '৳' + e.credit.toLocaleString() : '—'}</td><td style="text-align:right;font-weight:600">${e.balance < 0 ? '<span style="color:green">Overpaid ৳' + Math.abs(e.balance).toLocaleString() + '</span>' : '৳' + e.balance.toLocaleString()}</td></tr>`).join('');
    const lastBalance = entries.length > 0 ? entries[entries.length - 1].balance : 0;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ledger - ${supplierName}</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;padding:28px;color:#111;max-width:900px;margin:auto}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:6px 8px;border:1px solid #ccc}th{background:#f0f0f0;font-weight:700;text-align:left}.summary{display:flex;gap:24px;margin-top:16px;font-size:12px}.sum-box{border:1px solid #ccc;padding:8px 16px;border-radius:4px}@media print{body{padding:14px}}</style></head><body>${letterhead}<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px"><div><h2 style="margin:0;font-size:16px">Supplier Statement / Ledger</h2><p style="margin:2px 0;font-size:12px;color:#555">Supplier: <strong>${supplierName}</strong>${supplierPhone ? ' &nbsp; Phone: ' + supplierPhone : ''}</p><p style="margin:2px 0;font-size:11px;color:#888">Printed: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div></div><table><thead><tr><th>Date</th><th>Type</th><th>Reference</th><th>Description</th><th style="text-align:right">Debit (Dr)</th><th style="text-align:right">Credit (Cr)</th><th style="text-align:right">Balance</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="sum-box">Total Debit: <strong>৳${entries.reduce((s, e) => s + e.debit, 0).toLocaleString()}</strong></div><div class="sum-box">Total Credit: <strong>৳${entries.reduce((s, e) => s + e.credit, 0).toLocaleString()}</strong></div><div class="sum-box" style="font-weight:700;${lastBalance > 0 ? 'color:#c00' : 'color:#166534'}">Balance Due: <strong>৳${Math.abs(lastBalance).toLocaleString()}${lastBalance < 0 ? ' (Overpaid)' : ''}</strong></div></div></body></html>`;
    const w = window.open('', '_blank', 'width=1000,height=700');
    if (w) { w.document.write(html); w.document.close(); w.focus(); w.print(); }
  };

  const handleDeletePayment = async (paymentId: string) => {
    setDeletingPayment(true);
    const res = await deleteSupplierPayment(paymentId);
    if (res.success) {
      setDeletePaymentId(null);
      if (selectedSupplierId) {
        loadProfile(selectedSupplierId);
        loadLedger(selectedSupplierId);
      }
      loadDashboard();
    } else {
      alert(res.error || 'Failed to delete payment');
    }
    setDeletingPayment(false);
  };

  const savePayment = async () => {
    if (!paymentSupplierId || paymentAmount <= 0) return;
    setSavingPayment(true);
    const res = await createSupplierPayment({
      supplierId: paymentSupplierId,
      amount: paymentAmount,
      paymentMethod: paymentMethod,
      note: paymentNote,
    });
    if (res.success) {
      setLastPaymentAmount(paymentAmount);
      setLastPaymentMethod(paymentMethod);
      setPaymentSuccess(true);
      setPaymentSupplierDue(Math.max(0, paymentSupplierDue - paymentAmount));
      if (activeTab === 'profile' && selectedSupplierId) {
        loadProfile(selectedSupplierId);
        loadLedger(selectedSupplierId);
      }
      if (activeTab === 'suppliers') loadSuppliers();
      loadDashboard();
    }
    setSavingPayment(false);
  };

  // ═══════════════ View Profile ═══════════════

  const viewProfile = (id: string) => {
    setSelectedSupplierId(id);
    setProfileTab('purchases');
    setActiveTab('profile');
  };

  // ═══════════════ Delete Purchase ═══════════════

  const [deletePurchaseId, setDeletePurchaseId] = useState<string | null>(null);
  const handleDeletePurchase = async (id: string) => {
    setDeleting(true);
    const res = await deletePurchase(id);
    if (res.success) {
      setDeletePurchaseId(null);
      if (activeTab === 'purchases') loadPurchases();
      if (activeTab === 'profile' && selectedSupplierId) loadProfile(selectedSupplierId);
    }
    setDeleting(false);
  };

  // ═══════════════ Tabs ═══════════════

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'suppliers', label: 'Suppliers', icon: Users },
    { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { key: 'new-purchase', label: 'New Purchase', icon: Plus },
  ];

  // ═══════════════ RENDER ═══════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            Vendor Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your suppliers, purchases and payments</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {(activeTab === 'profile' ? [...tabs, { key: 'profile' as Tab, label: supplierProfile?.name || 'Profile', icon: Eye }] : tabs).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key !== 'profile') {
                  setActiveTab(tab.key);
                  setSelectedSupplierId(null);
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loading || !stats ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Suppliers', value: stats.supplierCount, icon: Users, color: 'blue', isCurrency: false },
                  { label: 'Total Purchase', value: stats.totalPurchase, icon: ShoppingCart, color: 'indigo', isCurrency: true },
                  { label: 'Total Paid', value: stats.totalPaid, icon: BadgeCheck, color: 'green', isCurrency: true },
                  { label: 'Total Due', value: stats.totalDue, icon: CircleDollarSign, color: 'red', isCurrency: true },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-500">{stat.label}</span>
                      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', `bg-${stat.color}-50`)}>
                        <stat.icon className={cn('w-4.5 h-4.5', `text-${stat.color}-600`)} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.isCurrency ? formatCurrency(stat.value) : stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Monthly Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-1">This Month</h3>
                  <p className="text-sm text-gray-500 mb-4">{stats.monthlyPurchaseCount} purchases</p>
                  <p className="text-3xl font-bold text-indigo-600">{formatCurrency(stats.monthlyPurchase)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">Top Suppliers</h3>
                  <div className="space-y-3">
                    {stats.topSuppliers.map((s) => (
                      <div key={s.id} className="flex items-center justify-between">
                        <button onClick={() => viewProfile(s.id)} className="text-sm font-medium text-blue-600 hover:underline">
                          {s.name}
                        </button>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900">{formatCurrency(s.totalPurchase)}</span>
                          {s.totalDue > 0 && (
                            <span className="text-xs text-red-500 ml-2">Due: {formatCurrency(s.totalDue)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {stats.topSuppliers.length === 0 && (
                      <p className="text-sm text-gray-400">No suppliers yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Purchases */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Recent Purchases</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Invoice</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {stats.recentPurchases.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3 text-gray-600">{formatDate(p.date)}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{p.invoiceNumber}</td>
                          <td className="px-6 py-3 text-gray-600">{p.supplier?.name}</td>
                          <td className="px-6 py-3 font-medium text-gray-900">{formatCurrency(p.totalAmount)}</td>
                          <td className="px-6 py-3">{getStatusBadge(p.status)}</td>
                        </tr>
                      ))}
                      {stats.recentPurchases.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No purchases yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ SUPPLIERS TAB ═══════════════ */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={supplierSearch}
                onChange={(e) => { setSupplierSearch(e.target.value); setSupplierPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => openSupplierForm()}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Total Purchase</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Paid</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Due</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <button onClick={() => viewProfile(s.id)} className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                            {s.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{s.phone}</td>
                        <td className="px-6 py-4 text-gray-500">{s.companyName || '—'}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(s.totalPurchase)}</td>
                        <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(s.totalPaid)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn('font-medium', s.totalDue > 0 ? 'text-red-600' : 'text-gray-400')}>
                            {formatCurrency(s.totalDue)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewProfile(s.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openSupplierForm(s)}
                              className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {s.totalDue > 0 && (
                              <button
                                onClick={() => openPaymentModal(s.id, s.totalDue, s.name)}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Make Payment"
                              >
                                <HandCoins className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirm(s.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {supplierPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Showing {(supplierPage - 1) * 20 + 1}–{Math.min(supplierPage * 20, supplierTotal)} of {supplierTotal}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={supplierPage <= 1}
                    onClick={() => setSupplierPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    {supplierPage} / {supplierPages}
                  </span>
                  <button
                    disabled={supplierPage >= supplierPages}
                    onClick={() => setSupplierPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ PURCHASES TAB ═══════════════ */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by invoice or supplier..."
                value={purchaseSearch}
                onChange={(e) => { setPurchaseSearch(e.target.value); setPurchasePage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setActiveTab('new-purchase')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Purchase
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Items</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Paid</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Due</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Status</th>
                    <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400">No purchases found</td>
                    </tr>
                  ) : (
                    purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 text-gray-600">{formatDate(p.date)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.invoiceNumber}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => viewProfile(p.supplierId)} className="text-blue-600 hover:underline">
                            {p.supplier?.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">{p.itemCount}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(p.totalAmount)}</td>
                        <td className="px-6 py-4 text-right text-green-600 font-medium">{formatCurrency(p.paidAmount)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn('font-medium', p.dueAmount > 0 ? 'text-red-600' : 'text-gray-400')}>
                            {formatCurrency(p.dueAmount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(p.status)}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewPurchaseDetail(p.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {p.dueAmount > 0 && (
                              <button
                                onClick={() => openPaymentModal(p.supplierId, p.dueAmount, p.supplier?.name || '')}
                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Pay Due"
                              >
                                <HandCoins className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setDeletePurchaseId(p.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {purchasePages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    disabled={purchasePage <= 1}
                    onClick={() => setPurchasePage((p) => p - 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-2">{purchasePage} / {purchasePages}</span>
                  <button
                    disabled={purchasePage >= purchasePages}
                    onClick={() => setPurchasePage((p) => p + 1)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════ NEW PURCHASE TAB ═══════════════ */}
      {activeTab === 'new-purchase' && (
        <div className="max-w-5xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              New Purchase Entry
            </h2>

            {/* Top fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Supplier select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier *</label>
                <select
                  value={purchaseSupplier}
                  onChange={(e) => setPurchaseSupplier(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Select Supplier</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.companyName ? `(${s.companyName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {/* Invoice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Number *</label>
                <input
                  type="text"
                  value={purchaseInvoice}
                  onChange={(e) => setPurchaseInvoice(e.target.value)}
                  placeholder="e.g. INV-2025-001"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Product search & add */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Add Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => { setProductSearch(e.target.value); setShowProductDropdown(true); }}
                  onFocus={() => { loadAllProducts(); setShowProductDropdown(true); }}
                  placeholder="Search product by name, SKU, or barcode... (click to see all)"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {productSearchLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
                {!productSearchLoading && productOptions.length > 0 && showProductDropdown && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{productOptions.length} products</span>
                )}

                {/* Product dropdown */}
                {showProductDropdown && productOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                    {productOptions.map((p) => {
                      const isAdded = !!purchaseItems.find((i) => i.productId === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => addProductToItems(p)}
                          disabled={isAdded}
                          className={cn(
                            'w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0',
                            isAdded && 'opacity-40 cursor-not-allowed bg-gray-50'
                          )}
                        >
                          {/* Product image */}
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {p.images && p.images.length > 0 ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {p.sku && <span className="text-xs text-gray-400">SKU: {p.sku}</span>}
                              {p.category && <span className="text-xs text-blue-500">{p.category.name}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500">Stock: <span className={cn('font-medium', p.stock > 0 ? 'text-green-600' : 'text-red-500')}>{p.stock}</span></p>
                            <p className="text-xs text-gray-500">Cost: <span className="font-medium text-gray-700">{formatCurrency(p.costPrice)}</span></p>
                          </div>
                          {isAdded && (
                            <div className="flex-shrink-0">
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Empty state when dropdown open but no products */}
                {showProductDropdown && !productSearchLoading && productOptions.length === 0 && (productSearch.trim() || allProductsLoaded) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-6 text-center">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No products found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                )}
              </div>
              {/* Click outside to close */}
              {showProductDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowProductDropdown(false)} />
              )}
            </div>

            {/* Purchase items table */}
            {purchaseItems.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {purchaseItems.length} {purchaseItems.length === 1 ? 'Product' : 'Products'} Added
                  </span>
                  <span className="text-xs text-gray-400">
                    Total Qty: {purchaseItems.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-28">Qty</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-36">Cost Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Subtotal</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchaseItems.map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updatePurchaseItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.costPrice}
                            onChange={(e) => updatePurchaseItem(idx, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removePurchaseItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom section: Note + Voucher + Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                <textarea
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Voucher/Receipt Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Voucher / Receipt</label>
                {voucherUrl ? (
                  <div className="relative group">
                    <div className="w-full h-40 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                      <img
                        src={voucherUrl}
                        alt="Voucher"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                      <a
                        href={voucherUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-lg text-gray-700 hover:bg-gray-100 transition-colors shadow-sm"
                        title="View full size"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => setVoucherUrl(null)}
                        className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={cn(
                    'flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer transition-colors',
                    uploadingVoucher ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 hover:border-gray-300'
                  )}>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingVoucher}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingVoucher(true);
                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('folder', 'purchase-vouchers');
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.success && data.url) {
                            setVoucherUrl(data.url);
                          } else {
                            alert('Upload failed');
                          }
                        } catch {
                          alert('Upload failed');
                        }
                        setUploadingVoucher(false);
                      }}
                    />
                    {uploadingVoucher ? (
                      <>
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                        <span className="text-xs text-blue-600 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Upload voucher image</span>
                        <span className="text-xs text-gray-400 mt-0.5">Click to browse</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(purchaseItems.reduce((s, i) => s + i.subtotal, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">Discount</span>
                  <input
                    type="number"
                    min={0}
                    value={purchaseDiscount}
                    onChange={(e) => setPurchaseDiscount(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1.5 text-right border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-sm font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(purchaseTotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-600">Paid Amount</span>
                  <input
                    type="number"
                    min={0}
                    value={purchasePaid}
                    onChange={(e) => setPurchasePaid(parseFloat(e.target.value) || 0)}
                    className="w-32 px-2 py-1.5 text-right border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="text-sm font-semibold text-gray-900">Due</span>
                  <span className={cn('text-lg font-bold', purchaseDue > 0 ? 'text-red-600' : 'text-green-600')}>
                    {formatCurrency(purchaseDue < 0 ? 0 : purchaseDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={savePurchaseEntry}
                disabled={savingPurchase || !purchaseSupplier || !purchaseInvoice.trim() || purchaseItems.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {savingPurchase ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Purchase
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ PROFILE TAB ═══════════════ */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {profileLoading || !supplierProfile ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => setActiveTab('suppliers')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Suppliers
              </button>

              {/* Profile header */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{supplierProfile.name}</h2>
                    {supplierProfile.companyName && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {supplierProfile.companyName}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {supplierProfile.phone}
                    </p>
                    {supplierProfile.address && (
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {supplierProfile.address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openPaymentModal(supplierProfile.id, supplierProfile.totalDue, supplierProfile.name)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                    >
                      <HandCoins className="w-4 h-4" />
                      Make Payment
                    </button>
                    <button
                      onClick={() => openSupplierForm(supplierProfile)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  </div>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-indigo-50 rounded-xl p-4">
                    <p className="text-xs text-indigo-600 font-medium mb-1">Total Purchase</p>
                    <p className="text-xl font-bold text-indigo-700">{formatCurrency(supplierProfile.totalPurchase)}</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(supplierProfile.totalPaid)}</p>
                  </div>
                  <div className={cn('rounded-xl p-4', supplierProfile.totalDue > 0 ? 'bg-red-50' : 'bg-gray-50')}>
                    <p className={cn('text-xs font-medium mb-1', supplierProfile.totalDue > 0 ? 'text-red-600' : 'text-gray-500')}>
                      Total Due
                    </p>
                    <p className={cn('text-xl font-bold', supplierProfile.totalDue > 0 ? 'text-red-700' : 'text-gray-400')}>
                      {formatCurrency(supplierProfile.totalDue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile sub-tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-1 -mb-px">
                  {[
                    { key: 'purchases', label: 'Purchase History', icon: ShoppingCart },
                    { key: 'payments', label: 'Payments', icon: HandCoins },
                    { key: 'ledger', label: 'Ledger', icon: Receipt },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setProfileTab(tab.key as any)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                        profileTab === tab.key
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Purchase History */}
              {profileTab === 'purchases' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Items</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Total</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Paid</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Due</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Status</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {supplierProfile.purchases.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No purchases yet</td>
                          </tr>
                        ) : (
                          supplierProfile.purchases.map((p: any) => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 text-gray-600">{formatDate(p.date)}</td>
                              <td className="px-6 py-4 font-medium text-gray-900">{p.invoiceNumber}</td>
                              <td className="px-6 py-4 text-center text-gray-600">{p.itemCount}</td>
                              <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(p.totalAmount)}</td>
                              <td className="px-6 py-4 text-right text-green-600">{formatCurrency(p.paidAmount)}</td>
                              <td className="px-6 py-4 text-right">
                                <span className={cn('font-medium', p.dueAmount > 0 ? 'text-red-600' : 'text-gray-400')}>
                                  {formatCurrency(p.dueAmount)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">{getStatusBadge(p.status)}</td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => viewPurchaseDetail(p.id)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Invoice"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setDeletePurchaseId(p.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payments */}
              {profileTab === 'payments' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Amount</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Method</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Note</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center w-16">Del</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {supplierProfile.payments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400">No payments yet</td>
                          </tr>
                        ) : (
                          supplierProfile.payments.map((p: any) => (
                            <tr key={p.id} className="hover:bg-gray-50/50">
                              <td className="px-6 py-4 text-gray-600">{formatDate(p.createdAt)}</td>
                              <td className="px-6 py-4 text-right font-medium text-green-600">{formatCurrency(p.amount)}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {PAYMENT_METHODS.find((m) => m.value === p.paymentMethod)?.label || p.paymentMethod}
                              </td>
                              <td className="px-6 py-4 text-gray-500">{p.note || '—'}</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => setDeletePaymentId(p.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete payment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ledger */}
              {profileTab === 'ledger' && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Ledger header with Print button */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">Account Statement</h4>
                      <p className="text-xs text-gray-400 mt-0.5">Complete transaction history</p>
                    </div>
                    <button
                      onClick={() => printLedger(supplierProfile.name, supplierProfile.phone, ledgerEntries)}
                      className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Ledger
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left bg-gray-50/50">
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Reference</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Debit (Dr)</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Credit (Cr)</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-right">Balance</th>
                          <th className="px-6 py-3.5 text-xs font-medium text-gray-500 uppercase text-center w-14"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ledgerEntries.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-6 py-12 text-center text-gray-400">No entries yet</td>
                          </tr>
                        ) : (
                          ledgerEntries.map((e, idx) => (
                            <tr key={idx} className={cn('hover:bg-gray-50/50', e.type === 'Payment' ? 'bg-green-50/20' : '')}>
                              <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(e.date)}</td>
                              <td className="px-6 py-4">
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                  e.type === 'Purchase' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                                )}>
                                  {e.type === 'Purchase' ? 'ক্রয়' : 'পেমেন্ট'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-900 text-xs">{e.reference}</td>
                              <td className="px-6 py-4 text-gray-500">{e.description}</td>
                              <td className="px-6 py-4 text-right font-medium text-red-600">
                                {e.debit > 0 ? formatCurrency(e.debit) : '—'}
                              </td>
                              <td className="px-6 py-4 text-right font-medium text-green-600">
                                {e.credit > 0 ? formatCurrency(e.credit) : '—'}
                              </td>
                              <td className={cn('px-6 py-4 text-right font-bold', e.balance < 0 ? 'text-green-600' : e.balance > 0 ? 'text-gray-900' : 'text-gray-400')}>
                                {e.balance < 0 ? `(${formatCurrency(Math.abs(e.balance))})` : formatCurrency(e.balance)}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {e.paymentId && (
                                  <button
                                    onClick={() => setDeletePaymentId(e.paymentId!)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete this payment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                        {/* Footer row */}
                        {ledgerEntries.length > 0 && (
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={4} className="px-6 py-3 font-semibold text-gray-700 text-sm">Total</td>
                            <td className="px-6 py-3 text-right font-bold text-red-600">
                              {formatCurrency(ledgerEntries.reduce((s, e) => s + e.debit, 0))}
                            </td>
                            <td className="px-6 py-3 text-right font-bold text-green-600">
                              {formatCurrency(ledgerEntries.reduce((s, e) => s + e.credit, 0))}
                            </td>
                            <td className={cn('px-6 py-3 text-right font-bold text-base', (ledgerEntries[ledgerEntries.length - 1]?.balance ?? 0) > 0 ? 'text-red-600' : 'text-green-600')}>
                              {formatCurrency(Math.abs(ledgerEntries[ledgerEntries.length - 1]?.balance ?? 0))}
                              {(ledgerEntries[ledgerEntries.length - 1]?.balance ?? 0) < 0 && <span className="text-xs ml-1 font-normal">(Overpaid)</span>}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════ MODALS ═══════════════ */}

      {/* Supplier Form Modal */}
      <AnimatePresence>
        {showSupplierForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSupplierForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSupplierId ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button onClick={() => setShowSupplierForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendor Name *</label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    placeholder="e.g. Rahul Electronics"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={supplierForm.companyName || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                    placeholder="e.g. Rahul Electronics Ltd."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                  <input
                    type="text"
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
                  <input
                    type="text"
                    value={supplierForm.address || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                  <textarea
                    value={supplierForm.notes || ''}
                    onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                    rows={3}
                    placeholder="Optional notes about this supplier..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
                <button
                  onClick={() => setShowSupplierForm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSupplier}
                  disabled={savingSupplier || !supplierForm.name.trim() || !supplierForm.phone.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {savingSupplier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingSupplierId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => !paymentSuccess && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
                    <HandCoins className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Vendor Payment</h3>
                    {paymentSupplierName && (
                      <p className="text-sm text-gray-500">{paymentSupplierName}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {paymentSuccess ? (
                /* ── Success State ── */
                <div className="p-6 space-y-5">
                  <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Payment Saved!</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      {formatCurrency(lastPaymentAmount)} paid via {PAYMENT_METHODS.find((m) => m.value === lastPaymentMethod)?.label}
                    </p>
                  </div>
                  {/* Remaining due */}
                  <div className={cn('rounded-xl p-4 text-center', paymentSupplierDue > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200')}>
                    <p className="text-xs font-medium mb-1 text-gray-500">Remaining Due</p>
                    <p className={cn('text-2xl font-bold', paymentSupplierDue > 0 ? 'text-amber-700' : 'text-green-700')}>
                      {formatCurrency(paymentSupplierDue)}
                    </p>
                    {paymentSupplierDue === 0 && <p className="text-xs text-green-600 mt-1 font-medium">✓ Fully settled</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => printPaymentReceipt(paymentSupplierName, lastPaymentAmount, lastPaymentMethod, paymentNote)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Print Receipt
                    </button>
                    {paymentSupplierDue > 0 ? (
                      <button
                        onClick={() => { setPaymentSuccess(false); setPaymentAmount(0); setPaymentNote(''); }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <HandCoins className="w-4 h-4" />
                        Pay More
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* ── Payment Form ── */
                <>
                  <div className="p-6 space-y-5">
                    {/* Due Info Banner */}
                    {paymentSupplierDue > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-red-500 mb-0.5">Total Baki (বকেয়া)</p>
                          <p className="text-2xl font-bold text-red-700">{formatCurrency(paymentSupplierDue)}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                      </div>
                    )}

                    {/* Quick Suggestion Buttons */}
                    {paymentSupplierDue > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          Quick Amount
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Full', amount: paymentSupplierDue },
                            { label: '3/4', amount: Math.floor(paymentSupplierDue * 0.75) },
                            { label: 'Half', amount: Math.floor(paymentSupplierDue * 0.5) },
                            { label: '1/4', amount: Math.floor(paymentSupplierDue * 0.25) },
                          ].map((s) => (
                            <button
                              key={s.label}
                              onClick={() => setPaymentAmount(s.amount)}
                              className={cn(
                                'flex flex-col items-center px-2 py-2 border rounded-xl text-xs font-medium transition-colors',
                                paymentAmount === s.amount
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                              )}
                            >
                              <span className="font-bold">{s.label}</span>
                              <span className="text-gray-500">{formatCurrency(s.amount)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amount Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">৳</span>
                        <input
                          type="number"
                          min={1}
                          value={paymentAmount || ''}
                          onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={cn(
                            'w-full pl-8 pr-3 py-3 border rounded-xl text-base font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors',
                            paymentAmount > paymentSupplierDue && paymentSupplierDue > 0
                              ? 'border-amber-400 bg-amber-50'
                              : 'border-gray-200'
                          )}
                        />
                      </div>
                      {/* Overpayment warning */}
                      {paymentAmount > paymentSupplierDue && paymentSupplierDue > 0 && (
                        <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Amount exceeds due by {formatCurrency(paymentAmount - paymentSupplierDue)}
                        </p>
                      )}
                      {paymentAmount > 0 && paymentSupplierDue > 0 && paymentAmount <= paymentSupplierDue && (
                        <p className="text-xs text-gray-500 mt-1.5">
                          Remaining after payment: <span className="font-medium text-gray-700">{formatCurrency(paymentSupplierDue - paymentAmount)}</span>
                        </p>
                      )}
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setPaymentMethod(m.value)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm font-medium transition-colors',
                              paymentMethod === m.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            )}
                          >
                            <m.icon className={cn('w-4 h-4', paymentMethod === m.value ? 'text-blue-600' : m.color)} />
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                      <textarea
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        rows={2}
                        placeholder="Optional note (e.g., cheque number, reference)..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={savePayment}
                      disabled={savingPayment || paymentAmount <= 0}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Save Payment {paymentAmount > 0 ? `(${formatCurrency(paymentAmount)})` : ''}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ INVOICE VIEW MODAL ═══════════════ */}
      <AnimatePresence>
        {(viewPurchase || viewPurchaseLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => { setViewPurchase(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {viewPurchaseLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : viewPurchase ? (
                <>
                  {/* Invoice Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Invoice #{viewPurchase.invoiceNumber}</h3>
                        <p className="text-sm text-gray-500">{formatDate(viewPurchase.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(viewPurchase.status)}
                      <button
                        onClick={() => printInvoice(viewPurchase)}
                        className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                      <button
                        onClick={() => { setViewPurchase(null); }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Supplier Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-400 uppercase mb-2">Supplier</p>
                      <p className="font-semibold text-gray-900">{viewPurchase.supplier.name}</p>
                      {viewPurchase.supplier.companyName && (
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {viewPurchase.supplier.companyName}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5" />
                        {viewPurchase.supplier.phone}
                      </p>
                      {viewPurchase.supplier.address && (
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {viewPurchase.supplier.address}
                        </p>
                      )}
                    </div>

                    {/* Items Table */}
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-2">Products ({viewPurchase.items.length})</p>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Cost</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {viewPurchase.items.map((item, idx) => (
                              <tr key={item.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {item.productImage ? (
                                      <img src={item.productImage} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-200" />
                                    ) : (
                                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Package className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-gray-900">{item.productName}</p>
                                      {item.productSku && <p className="text-xs text-gray-400">{item.productSku}</p>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right font-medium text-gray-800">{item.quantity}</td>
                                <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(item.costPrice)}</td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Totals + Payment Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Note & Attachment */}
                      <div className="space-y-3">
                        {viewPurchase.note && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Note</p>
                            <p className="text-sm text-gray-700">{viewPurchase.note}</p>
                          </div>
                        )}
                        {viewPurchase.attachment && (
                          <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs font-medium text-gray-400 uppercase mb-2">Voucher / Receipt</p>
                            <a href={viewPurchase.attachment} target="_blank" rel="noopener noreferrer">
                              <img
                                src={viewPurchase.attachment}
                                alt="Voucher"
                                className="w-full max-h-40 object-contain rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                              />
                            </a>
                            <a
                              href={viewPurchase.attachment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Open full image
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Totals */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                        <p className="text-xs font-medium text-gray-400 uppercase mb-3">Summary</p>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">{formatCurrency(viewPurchase.totalAmount + viewPurchase.discount)}</span>
                        </div>
                        {viewPurchase.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-medium text-green-600">-{formatCurrency(viewPurchase.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                          <span className="font-semibold text-gray-900">Total</span>
                          <span className="font-bold text-gray-900">{formatCurrency(viewPurchase.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Paid</span>
                          <span className="font-medium text-green-600">{formatCurrency(viewPurchase.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                          <span className={cn('font-semibold', viewPurchase.dueAmount > 0 ? 'text-red-700' : 'text-gray-500')}>Due</span>
                          <span className={cn('font-bold text-lg', viewPurchase.dueAmount > 0 ? 'text-red-600' : 'text-gray-400')}>
                            {formatCurrency(viewPurchase.dueAmount)}
                          </span>
                        </div>
                        {viewPurchase.dueAmount > 0 && (
                          <button
                            onClick={() => {
                              setViewPurchase(null);
                              openPaymentModal(viewPurchase.supplier.id, viewPurchase.dueAmount, viewPurchase.supplier.name);
                            }}
                            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <HandCoins className="w-4 h-4" />
                            Pay Due ({formatCurrency(viewPurchase.dueAmount)})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Supplier Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Supplier</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSupplier(deleteConfirm)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Purchase Confirm */}
      <AnimatePresence>
        {deletePurchaseId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeletePurchaseId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Purchase</h3>
                  <p className="text-sm text-gray-500">Stock will be reversed</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeletePurchaseId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePurchase(deletePurchaseId)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Payment Confirm */}
      <AnimatePresence>
        {deletePaymentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setDeletePaymentId(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Delete Payment</h3>
                  <p className="text-sm text-gray-500">Purchase dues will be recalculated</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeletePaymentId(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  Cancel
                </button>
                <button
                  onClick={() => handleDeletePayment(deletePaymentId)}
                  disabled={deletingPayment}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
